import Head from 'next/head';

import Layout, {siteTitle} from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import {getSortedCsvData} from '../lib/csv';
import {DataGrid, GridRowsProp, GridColDef, GridValidRowModel} from '@mui/x-data-grid';
import ScriptRunner from "../components/ScriptRunner";

export default function Home({data, columns}: {data: GridRowsProp, columns: GridColDef<GridValidRowModel>[]}) {
  return (<Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <ScriptRunner></ScriptRunner>
        <div>
          <DataGrid
              rows={data}
              getRowId={({ID}) => ID}
              columns={columns}
          />
        </div>
      </section>
    </Layout>);
}


export async function getStaticProps() {
  const {data, columns} = await getSortedCsvData();

  return {
    props: {
      data,
      columns,
    },
  };
}
