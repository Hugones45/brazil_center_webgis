// src/mapviwer-components/LegendBox.tsx
import { useState, useMemo, useEffect } from 'react';
import { CORS_PROXY } from './config';
import type { WMSLayer } from './config';

interface LegendBoxProps {
    activeLayers: Set<string>;
    baseUrl: string;
    needsProxy: boolean;
    layers: WMSLayer[];
}

export const LegendBox = ({ activeLayers, baseUrl, needsProxy, layers }: LegendBoxProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [legendUrls, setLegendUrls] = useState<Map<string, string>>(new Map());
    const [zoomLevel, setZoomLevel] = useState(1);

    const activeLayerNames = useMemo(() => {
        return Array.from(activeLayers).filter(name => layers.some(l => l.name === name));
    }, [activeLayers, layers]);

    useEffect(() => {
        if (!baseUrl || activeLayerNames.length === 0) {
            setLegendUrls(new Map());
            return;
        }
        const newUrls = new Map<string, string>();
        activeLayerNames.forEach(layerName => {
            let legendUrl = `${baseUrl}?service=WMS&version=1.3.0&request=GetLegendGraphic&layer=${layerName}&format=image/png&width=50&height=50&legend_options=fontSize:12;fontColor:0x000000;`;
            if (needsProxy) legendUrl = `${CORS_PROXY}${encodeURIComponent(legendUrl)}`;
            newUrls.set(layerName, legendUrl);
        });
        setLegendUrls(newUrls);
    }, [baseUrl, needsProxy, activeLayerNames]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

    if (activeLayerNames.length === 0) return null;

    return (
        <div style={{ width: '100%', backgroundColor: 'white', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: '15px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '10px' : '0', borderBottom: isExpanded ? '1px solid #F0F0F0' : 'none', paddingBottom: isExpanded ? '10px' : '0' }}>
                <div onClick={() => setIsExpanded(!isExpanded)} style={{ fontWeight: 'bold', fontSize: 16, color: '#3B3B3B', cursor: 'pointer', letterSpacing: '-0.3px' }}>
                    Legenda
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isExpanded && (
                        <div style={{ display: 'flex', gap: '2px' }}>
                            <button onClick={handleZoomIn} title="Controlar tamanho do rótulo" style={{ border: '1px solid #E0E0E0', background: '#FFFFFF', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: '18px', color: '#3B3B3B' }}>+</button>
                            <button onClick={handleZoomOut} title="Controlar tamanho do rótulo" style={{ border: '1px solid #E0E0E0', background: '#FFFFFF', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: '18px', color: '#3B3B3B' }}>-</button>
                        </div>
                    )}
                    <span onClick={() => setIsExpanded(!isExpanded)} style={{ fontSize: 16, cursor: 'pointer', padding: '0 5px', color: '#3B3B3B' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
            </div>
            {isExpanded && (
                <div style={{ overflowY: 'auto', overflowX: 'auto', padding: '0 5px 5px 0', maxHeight: 'calc(100vh - 450px)' }}>
                    {activeLayerNames.map((layerName) => {
                        const layerInfo = layers.find(l => l.name === layerName);
                        const imgSrc = legendUrls.get(layerName);
                        return (
                            <div key={layerName} style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #F0F0F0' }}>
                                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: '8px', color: '#3B3B3B' }}>{layerInfo?.title || layerName}</div>
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    {imgSrc && (
                                        <img src={imgSrc} alt={`Legenda para ${layerName}`} style={{ minWidth: '100%', width: 'auto', maxWidth: 'none', height: 'auto', objectFit: 'contain', transform: `scale(${zoomLevel})`, transformOrigin: 'top left', marginBottom: `-${(zoomLevel - 1) * 50}px` }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};