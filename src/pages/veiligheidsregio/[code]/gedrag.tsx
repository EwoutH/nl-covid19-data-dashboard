import Gedrag from '~/assets/gedrag.svg';
import { KpiTile } from '~/components-styled/kpi-tile';
import { KpiValue } from '~/components-styled/kpi-value';
import { Tile } from '~/components-styled/layout';
import { TwoKpiSection } from '~/components-styled/two-kpi-section';
import { Heading, Text } from '~/components-styled/typography';
import { ContentHeader_weekRangeHack } from '~/components/contentHeader_weekRangeHack';
import { FCWithLayout } from '~/components/layout';
import { getSafetyRegionLayout } from '~/components/layout/SafetyRegionLayout';
import { SEOHead } from '~/components/seoHead';
import { BehaviorLineChartTile } from '~/domain/behavior/behavior-line-chart-tile';
import { BehaviorTableTile } from '~/domain/behavior/behavior-table-tile';
import siteText from '~/locale/index';
import {
  getSafetyRegionData,
  getSafetyRegionPaths,
  ISafetyRegionData,
} from '~/static-props/safetyregion-data';

const text = siteText.regionaal_gedrag;

const BehaviorPage: FCWithLayout<ISafetyRegionData> = (props) => {
  const behaviorData = props.data.behavior;

  return (
    <>
      <SEOHead
        title={text.metadata.title}
        description={text.metadata.description}
      />
      <ContentHeader_weekRangeHack
        category={siteText.nationaal_layout.headings.gedrag}
        title={text.pagina.titel}
        Icon={Gedrag}
        subtitle={text.pagina.toelichting}
        metadata={{
          datumsText: text.datums,
          weekStartUnix: behaviorData.last_value.week_start_unix,
          weekEndUnix: behaviorData.last_value.week_end_unix,
          dateOfInsertionUnix: behaviorData.last_value.date_of_insertion_unix,
          dataSource: text.bron,
        }}
      />

      <TwoKpiSection>
        <Tile height="100%">
          <Heading level={3}>{text.onderzoek_uitleg.titel}</Heading>
          <Text>{text.onderzoek_uitleg.toelichting}</Text>
        </Tile>

        <KpiTile
          title={text.kpi.aantal_respondenten.titel}
          metadata={{
            source: text.kpi.aantal_respondenten.bron,
            date: [
              behaviorData.last_value.week_start_unix,
              behaviorData.last_value.week_end_unix,
            ],
          }}
        >
          <KpiValue absolute={behaviorData.last_value.number_of_participants} />
          <Text>{text.kpi.aantal_respondenten.toelichting}</Text>
        </KpiTile>
      </TwoKpiSection>

      <BehaviorTableTile
        behavior={behaviorData.last_value}
        title={text.basisregels.title}
        introduction={text.basisregels.intro}
        footer={text.basisregels.voetnoot}
      />

      <BehaviorLineChartTile
        title={text.basisregels_over_tijd.title}
        introduction={text.basisregels_over_tijd.intro}
        values={behaviorData.values}
      />
    </>
  );
};

BehaviorPage.getLayout = getSafetyRegionLayout();

export const getStaticProps = getSafetyRegionData();
export const getStaticPaths = getSafetyRegionPaths();

export default BehaviorPage;