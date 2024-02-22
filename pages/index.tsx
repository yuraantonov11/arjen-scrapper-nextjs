import Head from 'next/head';
import Layout, {siteTitle} from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import {getSortedCsvData} from '../lib/csv';
import {DataGrid, GridRowsProp, GridColDef, GridValidRowModel} from '@mui/x-data-grid';
import ScriptRunner from "../components/ScriptRunner";

export default function Home(props: {data: GridRowsProp, columns: GridColDef<GridValidRowModel>[]}) {
    const { data, columns } = props;

    return (
        <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <ScriptRunner />
        <div>
          {data.length && <DataGrid
              rows={data}
              getRowId={({ID}) => ID}
              columns={columns}
          />}
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
        return {
            props: {
                data: [],
                columns: [],
                error: error.message,
            },
        };
    }
}
