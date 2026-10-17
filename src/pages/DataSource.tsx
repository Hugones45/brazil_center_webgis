// DataSource.tsx
import { useState } from 'react';

// --- ORGANIZED SERVER LIST WITH WEBGIS LINKS ---
// Priority: Direct WebGIS Portal > INDE Visualizador > Official Institutional Website
const SERVER_OPTIONS = [
    { label: 'ANP', url: 'https://www.gov.br/anp/pt-br' },
    { label: 'ANTT', url: 'https://www.gov.br/antt/pt-br' },
    { label: 'BNDES', url: 'https://www.bndes.gov.br/wps/portal/site/home' },
    { label: 'Censipam', url: 'https://panorama.sipam.gov.br/' },
    { label: 'CPRM / SGB', url: 'https://geoportal.sgb.gov.br/' },
    { label: 'DataGeo - São Paulo', url: 'https://datageo.ambiente.sp.gov.br/' },
    { label: 'DNIT', url: 'https://www.gov.br/dnit/pt-br' },
    { label: 'EPE', url: 'https://www.epe.gov.br/pt' },
    { label: 'FUNAI', url: 'https://www.gov.br/funai/pt-br' },
    { label: 'FUNAI/CMR', url: 'https://cmr.funai.gov.br/' },
    { label: 'IBGE - CENSO 2022', url: 'https://censo2022.ibge.gov.br/panorama/' },
    { label: 'IBGE - Malhas Territoriais', url: 'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html' },
    { label: 'IBGE - ODS', url: 'https://odsbrasil.gov.br/' },
    { label: 'ICMBIO', url: 'https://www.gov.br/icmbio/pt-br' },
    { label: 'IDE SISEMA (MG)', url: 'https://visualizador.idesisema.meioambiente.mg.gov.br/' },
    { label: 'INDE Catalog', url: 'https://www.inde.gov.br/' },
    { label: 'INEA (RJ)', url: 'https://www.inea.rj.gov.br/' },
    { label: 'INPE', url: 'https://terrabrasilis.dpi.inpe.br/' },
    { label: 'IPHAN', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MB/COMPAAz', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MB/DPC', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MB/DPHDM', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MDIC', url: 'https://www.gov.br/mdic/pt-br' },
    { label: 'MMA', url: 'https://www.gov.br/mma/pt-br' },
    { label: 'MPA', url: 'https://www.gov.br/mpa/pt-br' },
    { label: 'MPO', url: 'https://www.gov.br/planejamento/pt-br/composicao/quem-e-quem' },
    { label: 'MTR', url: 'https://www.gov.br/pt-br/servicos/obter-o-documento-manifesto-de-transporte-de-residuos-mtr' },
    { label: 'MTUR', url: 'https://www.gov.br/turismo/pt-br' },
    { label: 'PGGM', url: 'https://pggmbrasil.org/' },
    { label: 'Prefeitura BH (MG) - BH Map', url: 'https://bhmap.pbh.gov.br/v2/' },
    { label: 'PRODEMG (MG)', url: 'https://www.prodemge.mg.gov.br/' },
    { label: 'SEPLAN (TO)', url: 'https://www.to.gov.br/seplan/' },
    { label: 'SPU', url: 'https://sistema.patrimoniodetodos.gov.br/' },
    { label: 'UFABC', url: 'https://www.ufabc.edu.br/' },
    { label: 'VALEC', url: 'https://www.gov.br/pt-br/orgaos/valec-engenharia-construcoes-e-ferrovias-s-a' },
];
const DataSource = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredServers = SERVER_OPTIONS.filter(server =>
        server.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{
            padding: '30px',
            minHeight: '100vh',
            backgroundColor: '#F7F7F7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '80vh',
            }}>

                <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '24px 30px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    // borderBottom: '2px solid #2563EB',
                    // borderTop: '4px solid #2563EB',
                    flexShrink: 0,
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)'
                }}>
                    <div>
                        <h2 style={{
                            color: '#3B3B3B', // Dark gray text
                            margin: 0,
                            fontSize: '22px',
                            fontWeight: 600,
                            letterSpacing: '-0.5px'
                        }}>
                            🗺️ Catálogo de Fontes de Dados
                        </h2>
                        <p style={{
                            color: '#767676',
                            margin: '4px 0 0 0',
                            fontSize: '13px',
                            letterSpacing: '0.3px'
                        }}>
                            Visualize os serviços geoespaciais disponíveis e suas origens no WebGIS
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                color: '#9CA3AF',
                                fontSize: '14px'
                            }}>
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar serviço..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '10px 12px 10px 36px',
                                    borderRadius: '4px',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: '#FFFFFF',
                                    color: '#3B3B3B',
                                    fontSize: '14px',
                                    width: '260px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                            />
                        </div>

                        <div style={{
                            backgroundColor: '#F8F8F8',
                            padding: '8px 18px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#3B3B3B',
                            border: '1px solid #E5E7EB',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                            letterSpacing: '0.3px'
                        }}>
                            <span style={{
                                color: '#2563EB',
                                fontWeight: 700,
                                marginRight: '6px'
                            }}>
                                {filteredServers.length}
                            </span>
                            Serviços Carregados
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div style={{
                    padding: '20px 30px 40px 30px',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                    }}>
                        <thead>
                            <tr style={{
                                borderBottom: '2px solid #2563EB'
                            }}>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '14px 16px',
                                    fontWeight: 600,
                                    color: '#3B3B3B',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    letterSpacing: '0.8px',
                                    width: '35%',
                                    backgroundColor: '#F8F8F8'
                                }}>
                                    Serviço
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '14px 16px',
                                    fontWeight: 600,
                                    color: '#3B3B3B',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    letterSpacing: '0.8px',
                                    backgroundColor: '#F8F8F8'
                                }}>
                                    Fonte (Link WebGIS)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServers.length > 0 ? (
                                filteredServers.map((server, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom: '1px solid #F0F0F0',
                                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'} // Light orange hover
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                                    >
                                        <td style={{
                                            padding: '14px 16px',
                                            color: '#3B3B3B',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: '#2563EB',
                                                display: 'inline-block',
                                                flexShrink: 0
                                            }} />
                                            {server.label}
                                        </td>
                                        <td style={{
                                            padding: '14px 16px',
                                            color: '#6B7280',
                                            fontFamily: 'monospace',
                                            fontSize: '13px'
                                        }}>
                                            {server.url ? (
                                                <a
                                                    href={server.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-block',
                                                        backgroundColor: '#2563EB',
                                                        color: '#FFFFFF',
                                                        padding: '7px 18px',
                                                        borderRadius: '4px',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        textDecoration: 'none',
                                                        boxShadow: '0 2px 6px rgba(43, 88, 236, 0.3)',
                                                        transition: 'all 0.2s ease',
                                                        cursor: 'pointer',
                                                        border: '1px solid transparent',
                                                        letterSpacing: '0.3px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        const target = e.target as HTMLAnchorElement;
                                                        target.style.backgroundColor = '#1D4ED8'; // Darker orange on hover
                                                        target.style.transform = 'translateY(-1px)';
                                                        target.style.boxShadow = '0 4px 10px rgba(43, 62, 236, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const target = e.target as HTMLAnchorElement;
                                                        target.style.backgroundColor = '#2563EB';
                                                        target.style.transform = 'translateY(0px)';
                                                        target.style.boxShadow = '0 4px 10px rgba(43, 62, 236, 0.4)';
                                                    }}
                                                >
                                                    Acessar WebGIS ↗
                                                </a>
                                            ) : (
                                                <span style={{
                                                    display: 'inline-block',
                                                    border: '1px dashed #D1D5DB',
                                                    padding: '4px 12px',
                                                    borderRadius: '4px',
                                                    color: '#9CA3AF',
                                                    fontSize: '12px'
                                                }}>
                                                    — link placeholder —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: '#6B7280',
                                        fontSize: '14px'
                                    }}>
                                        Nenhum serviço encontrado para "<strong>{searchTerm}</strong>"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{
                    padding: '16px 30px',
                    borderTop: '1px solid #F0F0F0',
                    backgroundColor: '#F8F8F8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#767676',
                    fontSize: '12px',
                    flexShrink: 0,
                    borderBottom: '3px solid #2563EB'
                }}>
                    <span>
                        Desenvolvido com dados GeoServer OWS
                    </span>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#2563EB',
                            display: 'inline-block'
                        }} />
                        Style Interface
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DataSource;