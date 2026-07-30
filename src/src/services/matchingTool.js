const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const intersectionRatio = (candidateValues = [], targetValues = []) => {
  if (!targetValues.length) return 1;
  const candidateSet = new Set(candidateValues.map(normalize));
  const matches = targetValues.filter((value) =>
    candidateSet.has(normalize(value)),
  ).length;
  return matches / targetValues.length;
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

/**
 * TOOL 3 — Matching Engine.
 * Trọng số cao nhất thuộc về mong muốn thực tập sinh (42%)
 * và kỹ năng/yêu cầu bắt buộc của nhà tuyển dụng (38%).
 */
export async function calculateTopMatches(
  { jdData, cvData, limit = 3 } = {},
  { onStatus } = {},
) {
  if (!jdData?.jobs?.length) throw new Error("JD_DATA_REQUIRED");
  if (!cvData?.skills?.length) throw new Error("CV_DATA_REQUIRED");

  onStatus?.({
    tool: "matching",
    state: "running",
    message: "Matching Engine đang so sánh CV với yêu cầu tuyển dụng...",
  });
  await wait(580);

  const candidateWishes = [
    ...(cvData.wishes?.targetDomains ?? []),
    ...(cvData.wishes?.workModes ?? []),
  ];

  const ranked = jdData.jobs.map((job) => {
    const requiredRatio = intersectionRatio(
      cvData.skills,
      job.requiredSkills,
    );
    const preferredRatio = intersectionRatio(
      cvData.skills,
      job.preferredSkills,
    );
    const wishRatio = intersectionRatio(candidateWishes, [
      ...job.targetWishes,
      job.workMode,
    ]);
    const experienceRatio =
      cvData.experienceYears >= job.minimumExperience
        ? 1
        : clamp(
            cvData.experienceYears / Math.max(job.minimumExperience, 1),
            0,
            1,
          );
    const fresherBonus = clamp(job.fresherFriendly / 5, 0, 1);

    const scoreDetail = {
      internWishes: Math.round(wishRatio * 42),
      employerRequirements: Math.round(requiredRatio * 38),
      preferredSkills: Math.round(preferredRatio * 10),
      experience: Math.round(experienceRatio * 7),
      fresherEnvironment: Math.round(fresherBonus * 3),
    };
    const rawScore = Object.values(scoreDetail).reduce(
      (sum, score) => sum + score,
      0,
    );
    const score = clamp(rawScore, 48, 97);
    const matchedSkills = job.requiredSkills.filter((skill) =>
      cvData.skills.map(normalize).includes(normalize(skill)),
    );
    const missingSkills = job.requiredSkills.filter(
      (skill) => !cvData.skills.map(normalize).includes(normalize(skill)),
    );

    const reasons = [
      matchedSkills.length
        ? `Khớp kỹ năng ${matchedSkills.slice(0, 3).join(", ")} với yêu cầu của ${job.teamName}.`
        : `Có nền tảng chuyển đổi phù hợp với vị trí ${job.position}.`,
      wishRatio >= 0.3
        ? "Môi trường và domain phù hợp mong muốn thực tập sinh."
        : `Nên tìm hiểu thêm domain ${job.targetWishes.slice(0, 2).join(", ")}.`,
    ];

    return {
      id: job.id,
      companyId: job.companyId,
      companyName: job.companyName,
      teamId: job.teamId,
      teamName: job.teamName,
      department: job.department,
      position: job.position,
      score,
      scoreDetail,
      reasons,
      matchedSkills,
      missingSkills,
      sourceJob: job,
    };
  });

  const topMatches = ranked
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map((match, index) => ({ ...match, rank: index + 1 }));

  onStatus?.({
    tool: "matching",
    state: "done",
    message: `Đã xếp hạng Top ${topMatches.length} cơ hội phù hợp nhất.`,
  });

  return {
    matches: topMatches,
    evaluatedJobs: ranked.length,
    weights: {
      internWishes: 0.42,
      employerRequirements: 0.38,
      preferredSkills: 0.1,
      experience: 0.07,
      fresherEnvironment: 0.03,
    },
    isMock: true,
  };
}
