import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Dashboard from '../pages/Dashboard';
import EquipmentCatalog from '../pages/EquipmentCatalog';
import EquipmentDetail from '../pages/EquipmentDetail';
import Templates from '../pages/Templates';
import TemplateBuilder from '../pages/TemplateBuilder';
import ReportBuilder from '../pages/ReportBuilder';
import ReportHistory from '../pages/ReportHistory';
import ReportViewer from '../pages/ReportViewer';
import Settings from '../pages/Settings';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/equipment', element: <EquipmentCatalog /> },
      { path: '/equipment/:id', element: <EquipmentDetail /> },
      { path: '/templates', element: <Templates /> },
      { path: '/templates/new', element: <TemplateBuilder /> },
      { path: '/templates/:id/edit', element: <TemplateBuilder /> },
      { path: '/reports/new', element: <ReportBuilder /> },
      { path: '/reports', element: <ReportHistory /> },
      { path: '/reports/:id', element: <ReportViewer /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
]);
