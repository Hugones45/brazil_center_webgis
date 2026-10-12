// src/mapviwer-components/config.ts

export const LIGHT_STYLE: any = {
    version: 8,
    sources: {
        'osm-light': {
            type: 'raster',
            tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
        }
    },
    layers: [
        { id: 'osm-light-layer', type: 'raster', source: 'osm-light' }
    ]
};

export const DARK_STYLE: any = {
    version: 8,
    sources: {
        'osm-dark': {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '© CARTO © OpenStreetMap contributors'
        }
    },
    layers: [
        { id: 'osm-dark-layer', type: 'raster', source: 'osm-dark' }
    ]
};

export const SATELLITE_STYLE: any = {
    version: 8,
    sources: {
        'esri-satellite': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics'
        }
    },
    layers: [
        { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' }
    ]
};

export const BASEMAP_LAYER_IDS = new Set([
    'osm-light-layer',
    'osm-dark-layer',
    'esri-satellite-layer'
]);

export const BASEMAP_SOURCE_IDS = ['osm-light', 'osm-dark', 'esri-satellite'];

export const PRJ_4674 = `GEOGCS["SIRGAS 2000",DATUM["Sistema_de_Referencia_Geocentrico_para_las_Americas_2000",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6674"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4674"]]`;

export const CORS_PROXY = 'https://corsproxy.io/?';

export interface WMSLayer {
    name: string;
    title: string;
    abstract?: string;
}

export interface FeatureProperties {
    [key: string]: any;
}

export type BBox = [number, number, number, number];

export const SERVER_OPTIONS = [
    { label: 'ANP - Agência Nacional do Petróleo, Gás Natural e Biocombustíveis', url: 'https://gishub.anp.gov.br/geoserver/ows' },
    { label: 'ANTT - Agência Nacional de Transportes Terrestres', url: 'https://geoservicos.inde.gov.br/geoserver/ANTT/ows' },
    { label: 'BNDES - Banco Nacional de Desenvolvimento Econômico e Social', url: 'https://geoservicos.inde.gov.br/geoserver/BNDES/ows' },
    { label: 'Censipam - Centro Gestor e Operacional do Sistema de Proteção da Amazônia', url: 'https://panorama.sipam.gov.br/geoserver/publico/ows' },
    { label: 'CPRM / SGB - Serviço Geológico do Brasil', url: 'https://geoservicos.sgb.gov.br/geoserver/geologia/ows' },
    { label: 'DataGeo - São Paulo', url: 'https://datageo.ambiente.sp.gov.br/geoserver/ows' },
    { label: 'DNIT - Departamento Nacional de Infraestrutura de Transportes', url: 'https://geoservicos.inde.gov.br/geoserver/DNIT/ows' },
    { label: 'EPE - Empresa de Pesquisa Energética', url: 'https://geoservicos.inde.gov.br/geoserver/EPE/ows' },
    { label: 'FUNAI - Fundação Nacional dos Povos Indígenas', url: 'https://geoserver.funai.gov.br/geoserver/ows' },
    { label: 'FUNAI/CMR - Centro de Monitoramento e Resolução de Conflitos Fundiários', url: 'https://cmr.funai.gov.br/geoserver/ows' },
    { label: 'IBGE - CENSO 2022 - Instituto Brasileiro de Geografia e Estatística', url: 'https://geoservicoscenso2022.ibge.gov.br/geoserver/censo2022/ows' },
    { label: 'IBGE - Malhas Territoriais - Instituto Brasileiro de Geografia e Estatística', url: 'https://geoservicos.ibge.gov.br/geoserver/ows' },
    { label: 'IBGE - ODS - Instituto Brasileiro de Geografia e Estatística', url: 'https://geoservicos.ibge.gov.br/geoserver/ODS/ows' },
    { label: 'ICMBIO - Instituto Chico Mendes de Conservação da Biodiversidade', url: 'https://geoservicos.inde.gov.br/geoserver/ICMBio/ows' },
    { label: 'IDE SISEMA - Infraestrutura de Dados Espaciais do Sistema Estadual de Meio Ambiente de Minas Gerais', url: 'https://geoserver.meioambiente.mg.gov.br/ows' },
    { label: 'INDE Catalog - Infraestrutura Nacional de Dados Espaciais', url: 'https://geoservicos.inde.gov.br/geoserver/wfs' },
    { label: 'INEA - Instituto Estadual do Ambiente do Rio de Janeiro', url: 'https://geoservicos.inde.gov.br/geoserver/INEA/ows' },
    { label: 'INPE - Instituto Nacional de Pesquisas Espaciais', url: 'https://terrabrasilis.dpi.inpe.br/geoserver/ows' },
    { label: 'IPHAN - Instituto do Patrimônio Histórico e Artístico Nacional', url: 'https://geoserver.iphan.gov.br/geoserver/ows' },
    { label: 'MB/COMPAAz - Marinha do Brasil / Comissão de Planejamento Ambiental da Amazônia', url: 'https://geoservicos.inde.gov.br/geoserver/COMPAAz/ows' },
    { label: 'MB/DPC - Marinha do Brasil / Diretoria de Portos e Costas', url: 'https://geoservicos.inde.gov.br/geoserver/DPC/ows' },
    { label: 'MB/DPHDM - Marinha do Brasil / Diretoria de Hidrografia e Navegação', url: 'https://geoservicos.inde.gov.br/geoserver/DPHDM/ows' },
    { label: 'MDIC - Ministério do Desenvolvimento, Indústria, Comércio e Serviços', url: 'https://geoservicos.inde.gov.br/geoserver/MDIC/ows' },
    { label: 'MMA - Ministério do Meio Ambiente e Mudança do Clima', url: 'https://geoservicos.inde.gov.br/geoserver/MMA/ows' },
    { label: 'MPA - Ministério da Pesca e Aquicultura', url: 'https://geoservicos.inde.gov.br/geoserver/MPA/ows' },
    { label: 'MPO - Ministério do Planejamento e Orçamento', url: 'https://geoservicos.inde.gov.br/geoserver/MPOG/ows' },
    { label: 'MTR - Ministério dos Transportes', url: 'https://geoservicos.inde.gov.br/geoserver/MInfra/ows' },
    { label: 'MTUR - Ministério do Turismo', url: 'https://geoservicos.inde.gov.br/geoserver/MTU/ows' },
    { label: 'PGGM - Presidência da República / Gabinete de Gestão Integrada', url: 'https://geoservicos.inde.gov.br/geoserver/PGGM/ows' },
    { label: 'Prefeitura BH (MG) - BH Map', url: 'https://bhmap.pbh.gov.br/v2/api/idebhgeo/wms' },
    { label: 'PRODEMG (MG) - Companhia de Tecnologia da Informação do Estado de Minas Gerais', url: 'http://geoserver.prodemge.gov.br/geoserver/ows' },
    { label: 'SEPLAN (TO) - Secretaria do Planejamento e Orçamento do Tocantins', url: 'https://geoportal.to.gov.br/geoserver/ows' },
    { label: 'SPU - Secretaria de Patrimônio da União', url: 'https://geoservicos.inde.gov.br/geoserver/SPU/ows' },
    { label: 'UFABC - Universidade Federal do ABC', url: 'https://geoservicos.inde.gov.br/geoserver/UFABC/ows' },
    { label: 'VALEC - Engenharia, Construções e Ferrovias S.A.', url: 'https://geoservicos.inde.gov.br/geoserver/VALEC/ows' },
    { label: 'Personalizado', url: '' },
];