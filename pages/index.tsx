import Head from 'next/head';
import Layout, {siteTitle} from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import {getSortedCsvData} from '../lib/csv';
import {DataGrid, GridColDef, GridRowsProp, GridValidRowModel} from '@mui/x-data-grid';
import ScriptRunner from "../components/ScriptRunner";
import {useEffect, useState} from "react";
import {CircularProgress} from "@mui/material";

export default function Home(props: { data: GridRowsProp, columns: GridColDef<GridValidRowModel>[] }) {
    const {data, columns} = props;
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (data.length > 0) {
            setLoading(false);
        }
    }, [data]);

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
              data.length > 0 && <DataGrid
                  rows={data}
                  getRowId={({ID}) => ID}
                  columns={columns}
              />
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
    } catch (error) {
        console.error(error);
        return {
            props: {
                data: [],
                columns: [],
                error: error.message,
            },
        };
    }
}
