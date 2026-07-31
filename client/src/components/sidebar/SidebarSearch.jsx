import { Search } from "lucide-react";

const SidebarSearch = ({
  value,
  onChange,
}) => {
  return (
    <div className="search-box">
      <Search size={18} />

      <input
        type="text"
        placeholder="Search people..."
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />
    </div>
  );
};

export default SidebarSearch;