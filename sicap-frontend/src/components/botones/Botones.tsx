import "../../styles/styles.css";
export function Botones({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
      return (
        <div className="Contenedor_Boton">
            <button className="Boton" {...props}>
                {""}
                {children} {""}
            </button>
        </div>
      );
}