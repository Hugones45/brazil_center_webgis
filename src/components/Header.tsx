import Navbar from "./NaVbar";

const Header = () => {
    return (
        <header
            style={{
                background: "#ffffff",
                color: "#3B3B3B",
                height: "76px",
                padding: "0 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxSizing: "border-box",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                zIndex: 1100,
                position: "relative",
                borderBottom: "1px solid #E0E0E0",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px", // Increased space between logo and app name
                    minWidth: "320px", // Ensures the left section takes enough space
                }}
            >


                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "22px",
                            fontWeight: 600,
                            letterSpacing: "-0.5px",
                            lineHeight: "1.2",
                            color: "#3B3B3B",
                            padding: 0
                        }}
                    >
                        GeoExplorer
                    </h1>

                    <p
                        style={{
                            margin: "3px 0 0",
                            fontSize: "11px",
                            color: "#EC6A2B",
                            fontWeight: 500,
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                        }}
                    >
                        Visualizador de Dados Geoespaciais WMS/WFS
                    </p>
                </div>
            </div>

            {/* Navbar - Taking up middle space with flex */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <Navbar />
            </div>

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
                        color: "#666666",
                    }}
                >
                    <span
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#EC6A2B",
                            boxShadow: "0 0 8px rgba(236, 106, 43, 0.35)",
                            display: "inline-block",
                        }}
                    />

                    <span>Geoservidores Brasileiros</span>
                </div>

                <span
                    style={{
                        padding: "5px 10px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(236, 106, 43, 0.08)",
                        border: "1px solid rgba(236, 106, 43, 0.15)",
                        color: "#EC6A2B",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                    }}
                >
                    v1.0.0
                </span>
            </div>

            {/* Subtle orange accent */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "2px",
                    background:
                        "linear-gradient(90deg, #EC6A2B 0%, #D64A12 45%, rgba(236, 106, 43, 0) 100%)",
                }}
            />
        </header>
    );
};

export default Header;