import Head from 'next/head';
import Box from '@mui/joy/Box';
import CircularProgress from '@mui/joy/CircularProgress';

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
          {!data && <Loader />}
          <DataGrid
              rows={data}
              getRowId={({ID}) => ID}
              columns={columns}
              paginationModel={{
                  pageSize: 25,
                  page: 0
              }}
          />
        </div>
      </section>
    </Layout>);
}

const Loader = () => {
  return (<Box
      sx={{display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap'}}>
            <CircularProgress variant="plain"/>
          </Box>);
};

export async function getStaticProps() {
  const {data, columns} = await getSortedCsvData();


  return {
    props: {
      data,
      columns,
    },
  };
}
