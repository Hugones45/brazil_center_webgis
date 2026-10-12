interface AttributeTableProps {
    showTable: boolean;
    selectedLayerForTable: string | null;
    setShowTable: (val: boolean) => void;
    setSelectedLayerForTable: (val: string | null) => void;
    tableHeight: number;
    handleDragStart: (e: React.MouseEvent) => void;
    tableData: any[];
    totalPages: number;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    rowsPerPage: number;
    handleRowsPerPageChange: (val: number) => void;
    loadingTable: boolean;
    tableError: string | null;
    tableColumns: string[];
    paginatedData: any[];
    spatialFilter: GeoJSON.Geometry | null;
    layers: any[];
}

export const AttributeTable = ({
    showTable, selectedLayerForTable, setShowTable, setSelectedLayerForTable,
    tableHeight, handleDragStart, tableData, totalPages, currentPage, setCurrentPage,
    rowsPerPage, handleRowsPerPageChange, loadingTable, tableError, tableColumns,
    paginatedData, spatialFilter, layers
}: AttributeTableProps) => {

    if (!showTable || !selectedLayerForTable) return null;

    return (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${tableHeight}vh`, backgroundColor: 'white', borderTop: '3px solid #1976D2', boxShadow: '0 -8px 30px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '0 30px', boxSizing: 'border-box', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            <div onMouseDown={handleDragStart} style={{ position: 'absolute', top: -8, left: 0, right: 0, height: 16, cursor: 'row-resize', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 60, height: 5, backgroundColor: '#bbb', borderRadius: 3, transition: 'background-color 0.2s' }} onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#1976D2'; }} onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = '#bbb'; }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', backgroundColor: '#F8F8F8', borderBottom: '1px solid #F0F0F0', marginTop: '4px', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14, color: '#3B3B3B' }}>📊 Tabela de Atributos</div>
                    <div style={{ fontSize: 12, color: '#666', backgroundColor: '#E3F2FD', padding: '2px 10px', borderRadius: 10 }}>
                        {layers.find(l => l.name === selectedLayerForTable)?.title || selectedLayerForTable}
                    </div>
                    {spatialFilter && <div style={{ fontSize: 11, color: '#1565C0', backgroundColor: '#E3F2FD', padding: '2px 10px', borderRadius: 10, fontWeight: 'bold' }}>🎯 Dados Filtrados</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 11, color: '#333', backgroundColor: '#F0F0F0', padding: '4px 10px', borderRadius: 4, fontWeight: 500 }}>
                        {tableData.length} feições ({totalPages} páginas)
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#888' }}>por pág:</span>
                        <select value={rowsPerPage} onChange={(e) => handleRowsPerPageChange(Number(e.target.value))} style={{ padding: '3px 4px', fontSize: 10, border: '1px solid #E0E0E0', borderRadius: 3, cursor: 'pointer', backgroundColor: 'white' }}>
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option><option value={500}>500</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <button onClick={() => setCurrentPage(0)} disabled={currentPage === 0} title="Primeira página" style={{ padding: '4px 6px', fontSize: 11, backgroundColor: currentPage === 0 ? '#E0E0E0' : '#1976D2', color: 'white', border: 'none', borderRadius: 3, cursor: currentPage === 0 ? 'not-allowed' : 'pointer', lineHeight: 1 }}>⏮</button>
                        <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} title="Página anterior" style={{ padding: '4px 6px', fontSize: 11, backgroundColor: currentPage === 0 ? '#E0E0E0' : '#1976D2', color: 'white', border: 'none', borderRadius: 3, cursor: currentPage === 0 ? 'not-allowed' : 'pointer', lineHeight: 1 }}>◀</button>
                        <input type="number" min={1} max={totalPages} value={currentPage + 1} onChange={(e) => { const val = parseInt(e.target.value); if (val >= 1 && val <= totalPages) setCurrentPage(val - 1); }} title="Ir para página" style={{ width: '40px', padding: '3px 4px', fontSize: 11, border: '1px solid #1976D2', borderRadius: 3, textAlign: 'center', fontWeight: 'bold', color: '#1976D2' }} />
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} title="Próxima página" style={{ padding: '4px 6px', fontSize: 11, backgroundColor: currentPage >= totalPages - 1 ? '#E0E0E0' : '#1976D2', color: 'white', border: 'none', borderRadius: 3, cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', lineHeight: 1 }}>▶</button>
                        <button onClick={() => setCurrentPage(totalPages - 1)} disabled={currentPage >= totalPages - 1} title="Última página" style={{ padding: '4px 6px', fontSize: 11, backgroundColor: currentPage >= totalPages - 1 ? '#E0E0E0' : '#1976D2', color: 'white', border: 'none', borderRadius: 3, cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', lineHeight: 1 }}>⏭</button>
                    </div>

                    <button onClick={() => { setShowTable(false); setSelectedLayerForTable(null); }} style={{ padding: '6px 15px', fontSize: 12, backgroundColor: '#E53935', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', marginLeft: 8 }}>✕ Fechar Tabela</button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0, paddingBottom: '60px' }}>
                {loadingTable ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666', fontSize: 14 }}>Carregando dados dos atributos...</div>
                ) : tableError ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#E53935', fontSize: 14 }}>{tableError}</div>
                ) : (
                    <div style={{ overflowX: 'scroll', overflowY: 'auto', height: '100%', width: '100%' }}>
                        <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                            <thead>
                                <tr style={{ position: 'sticky', top: 0, backgroundColor: '#F8F8F8', zIndex: 1 }}>
                                    <th style={{ padding: '8px 12px', borderBottom: '2px solid #1976D2', backgroundColor: '#E3F2FD', textAlign: 'left', fontWeight: 'bold', color: '#3B3B3B', minWidth: '60px', position: 'sticky', left: 0, zIndex: 2 }}>#</th>
                                    {tableColumns.map(column => (
                                        <th key={column} style={{ padding: '8px 12px', borderBottom: '2px solid #1976D2', backgroundColor: '#E3F2FD', textAlign: 'left', fontWeight: 'bold', color: '#3B3B3B', minWidth: '150px', whiteSpace: 'nowrap' }}>{column}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, index) => (
                                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#FAFAFA', borderBottom: '1px solid #F0F0F0' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#E3F2FD'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = index % 2 === 0 ? 'white' : '#FAFAFA'; }}>
                                        <td style={{ padding: '6px 12px', color: '#999', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: index % 2 === 0 ? 'white' : '#FAFAFA', zIndex: 0 }}>{currentPage * rowsPerPage + index + 1}</td>
                                        {tableColumns.map(column => (
                                            <td key={column} style={{ padding: '6px 12px', color: '#333', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {row[column] !== null && row[column] !== undefined ? String(row[column]) : 'NULO'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loadingTable && !tableError && tableData.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', backgroundColor: '#F8F8F8', borderTop: '1px solid #F0F0F0', fontSize: 11, flexShrink: 0 }}>
                    <div style={{ color: '#666' }}>Mostrando {currentPage * rowsPerPage + 1} - {Math.min((currentPage + 1) * rowsPerPage, tableData.length)} de {tableData.length} feições</div>
                    <div style={{ color: '#888', fontSize: 10 }}>Página {currentPage + 1} de {totalPages}</div>
                </div>
            )}
        </div>
    );
};