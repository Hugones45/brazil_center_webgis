import layersMap from "../assets/ChatGPT Image 11 de ago. de 2026, 00_51_29.png";
import Navbar from "./NaVbar";

const Header = () => {
    return (
        <header
            style={{
                background:
                    "linear-gradient(110deg, #172033 0%, #172a42 45%, #123b43 100%)",
                color: "#ffffff",
                height: "76px",
                padding: "0 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxSizing: "border-box",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.16)",
                zIndex: 1100,
                position: "relative",
            }}
        >
            {/* Left - Logo and Brand */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                <img
                    src={layersMap}
                    alt="GeoExplorer"
                    style={{
                        width: "46px",
                        height: "46px",
                        objectFit: "contain",
                        display: "block",
                    }}
                />

                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "21px",
                            fontWeight: 650,
                            letterSpacing: "-0.3px",
                            lineHeight: "1.2",
                        }}
                    >
                        GeoExplorer
                    </h1>

                    <p
                        style={{
                            margin: "3px 0 0",
                            fontSize: "11px",
                            color: "#62d39b",
                            fontWeight: 500,
                            letterSpacing: "0.2px",
                        }}
                    >
                        Visualizador de Dados Geoespaciais WMS/WFS
                    </p>
                </div>
            </div>
            <Navbar />
            {/* Right - Project information */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    fontSize: "12px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#e5e9ef",
                    }}
                >
                    <span
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#39d98a",
                            boxShadow: "0 0 8px rgba(57, 217, 138, 0.55)",
                            display: "inline-block",
                        }}
                    />

                    <span>Geoservidores Brasileiros (cornifer1.0)</span>
                </div>

                <span
                    style={{
                        padding: "5px 10px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "#cbd5e1",
                        fontSize: "10px",
                        fontWeight: 500,
                    }}
                >
                    v1.0.0
                </span>
            </div>

            {/* Subtle green accent */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "2px",
                    background:
                        "linear-gradient(90deg, #36d98a 0%, #35b8a0 45%, rgba(53, 184, 160, 0) 100%)",
                }}
            />
        </header>
    );
};

export default Header;