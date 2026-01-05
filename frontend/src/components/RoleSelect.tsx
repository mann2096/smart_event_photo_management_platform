type RoleSelectProps = {
  currentRole: string;
  onChange: (role: string) => void;
};

export default function RoleSelect({currentRole,onChange,}:RoleSelectProps){
  return(
    <select
      value={currentRole}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="member">Member</option>
      <option value="photographer">Photographer</option>
      <option value="coordinator">Coordinator</option>
    </select>
  );
}
