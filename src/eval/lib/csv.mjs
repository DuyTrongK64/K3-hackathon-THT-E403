export function parseCsv(text) {
  if (!text?.trim()) return { headers: [], rows: [] };

  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  record.push(field);
  if (record.some((value) => value.trim())) records.push(record);
  const headers = records.shift()?.map((value) => value.trim()) ?? [];
  const rows = records.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index]?.trim() ?? ""]),
    ),
  );
  return { headers, rows };
}

function quoteCsv(value) {
  const stringValue = String(value ?? "");
  return /[",\r\n]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue;
}

export function stringifyCsv(headers, rows) {
  return [
    headers.map(quoteCsv).join(","),
    ...rows.map((row) =>
      headers.map((header) => quoteCsv(row[header])).join(","),
    ),
  ].join("\n");
}

