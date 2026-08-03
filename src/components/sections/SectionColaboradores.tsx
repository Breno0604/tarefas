import { COLABORADORES } from '../../data/mockData';
import CollaboratorCard from '../collaborators/CollaboratorCard';

export default function SectionColaboradores() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {COLABORADORES.map((c) => (
        <CollaboratorCard key={c.id} colaborador={c} />
      ))}
    </div>
  );
}
