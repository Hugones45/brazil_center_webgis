import { NavLink } from "react-router-dom";

const Navbar = () => {
    return (
        <nav
            style={{
                height: "42px",
                display: "flex",
                alignItems: "stretch",
            }}
        >
            <ul
                style={{
                    display: "flex",
                    alignItems: "stretch",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    gap: "16px", // Reduced gap for better visibility
                }}
            >
                {/* Map Viewer */}
                <li>
                    <NavLink
                        to="/"
                        end
                        style={({ isActive }) => ({
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px", // Reduced gap between icon and text
                            padding: "0 16px",
                            boxSizing: "border-box",

                            color: isActive
                                ? "#EC6A2B"
                                : "#666666",

                            textDecoration: "none",
                            fontSize: "12px",

                            fontWeight: isActive ? 600 : 450,

                            backgroundColor: isActive
                                ? "rgba(236, 106, 43, 0.05)"
                                : "transparent",

                            borderBottom: isActive
                                ? "2px solid #EC6A2B"
                                : "2px solid transparent",

                            transition:
                                "background-color 0.2s ease, color 0.2s ease",

                            cursor: "pointer",
                        })}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                lineHeight: 1,
                            }}
                        >
                            🗺
                        </span>

                        <span>GeoVisão</span>
                    </NavLink>
                </li>

                {/* Data Source */}
                <li>
                    <NavLink
                        to="/datasource"
                        style={({ isActive }) => ({
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px", // Reduced gap between icon and text
                            padding: "0 16px",
                            boxSizing: "border-box",

                            color: isActive
                                ? "#EC6A2B"
                                : "#666666",

                            textDecoration: "none",
                            fontSize: "12px",

                            fontWeight: isActive ? 600 : 450,

                            backgroundColor: isActive
                                ? "rgba(236, 106, 43, 0.05)"
                                : "transparent",

                            borderBottom: isActive
                                ? "2px solid #EC6A2B"
                                : "2px solid transparent",

                            transition:
                                "background-color 0.2s ease, color 0.2s ease",

                            cursor: "pointer",
                        })}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                lineHeight: 1,
                            }}
                        >
                            ◈
                        </span>

                        <span>Fontes dos Dados</span>
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;