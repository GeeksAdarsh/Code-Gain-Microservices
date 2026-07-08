import AdminLayout from '../components/AdminLayout';
import Problems from './Problems';
import { useNavigate } from 'react-router-dom';

export default function AdminProblems() {
  const navigate = useNavigate();
  const handleSection = (sec) => {
    navigate('/admin', { state: { section: sec } });
  };
  return (
    <AdminLayout section="problems" onSectionChange={handleSection} startCollapsed={true}>
      <Problems />
    </AdminLayout>
  );
}
