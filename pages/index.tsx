import Head from 'next/head';
import Layout, {siteTitle} from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import {getSortedCsvData} from '../lib/csv';
import {DataGrid, GridColDef, GridRowsProp, GridValidRowModel} from '@mui/x-data-grid';
import ScriptRunner from "../components/ScriptRunner";
import {useEffect, useState} from "react";
import {Alert, CircularProgress} from "@mui/material";

interface IProps {
    data: GridRowsProp;
    columns: GridColDef<GridValidRowModel>[];
    error?: string;
}
export default function Home(props: IProps) {
    const {data, columns, error} = props;
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (error || data.length > 0) {
            setLoading(false);
        }
    }, [data, error]);

    return (
        <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <ScriptRunner/>
        <div>
          {loading ? (
              <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '50vh'
              }}>
              <CircularProgress/>
            </div>
          ) : (
              data.length > 0 ? <DataGrid
                  rows={data}
                  getRowId={({ID}) => ID}
                  columns={columns}
              /> : <Alert severity="error">{error}</Alert>
          )}
        </div>
      </section>
    </Layout>
    );
}

export async function getStaticProps() {
    try {
        const {data, columns} = await getSortedCsvData();

        return {
            props: {
                data,
                columns,
            },
        };
    } catch ({code, path, message}) {
        const error = (code === 'ENOENT') ? `Error: ${path} file not found` : message ;
        return {
            props: {
                data: [],
                columns: [],
                error,
            },
        };
    }
}
