import fsPromises from "fs/promises";
import Papa from 'papaparse';

interface CsvData {
  data: unknown[];
  columns: {
    field: string;
    headerName: string;
  }[];
  meta: {
    mtime: Date;
    birthtime: Date;
  };
}

export async function getSortedCsvData(): Promise<CsvData> {
  const filePath = 'static/output.csv';

  try {
    await fsPromises.access(filePath);

    const fileContent = await fsPromises.readFile(filePath, 'utf-8');
    const {mtime, birthtime} = await fsPromises.stat(filePath);

    const {data, meta} = Papa.parse(fileContent, {
      header: true,
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
        birthtime,
      },
    };
  } catch (error) {
    console.warn(error.message);
    throw error;
  }
}
