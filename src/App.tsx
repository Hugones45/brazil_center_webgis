import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/NaVbar';
import MapViewer from './pages/MapViwer';
import DataSource from './pages/DataSource';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<MapViewer />} />
          <Route path="/datasource" element={<DataSource />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;