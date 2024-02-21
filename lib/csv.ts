import fsPromises from "fs/promises";
import Papa from 'papaparse';

export async function getSortedCsvData(): Promise<{
  data: unknown[],
  columns: {
    field: string;
    headerName: string;
  }[],
  meta: {
    mtime: Date;
    birthtime: Date;
  }}> {
  const fileContent = await fsPromises.readFile('static/output_old.csv', 'utf-8');
  const {mtime, birthtime} = await fsPromises.stat('static/output_old.csv');

  const {data, meta} = Papa.parse(fileContent,{
    header: true
  });
  const columns = meta.fields.map(field => ({
    field,
    headerName: field,
  }));

  return {
    data,
    columns,
    meta: {
      mtime,
      birthtime
    }};
}
