import { useTheme } from './ThemeContext';
import Sol from '../../assets/sol.png';
import Luna from '../../assets/luna.png';
import '../../index.css'

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div style={{ position: "fixed", top: 96, left: 40, zIndex: 950 }}>
      <label className="switch">
        <input
          type="checkbox"
          checked={theme === "dark"}
          onChange={toggleTheme}
        />
        <span className="slider">
          <span className="icon sun"><img src={Sol} alt="Sol" className='icon' width={20} height={20} /></span>
          <span className="icon moon"><img src={Luna} alt="Luna" className='icon' width={20} height={20}/></span>
        </span>
      </label>
    </div>
  );
}

export default ThemeToggleButton;