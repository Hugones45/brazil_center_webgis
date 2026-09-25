// import layersMap from "../assets/ChatGPT Image 11 de ago. de 2026, 00_51_29.png";
// import Navbar from "./NaVbar";

// const Header = () => {
//     return (
//         <header
//             style={{
//                 background:
//                     "linear-gradient(110deg, #172033 0%, #172a42 45%, #123b43 100%)",
//                 color: "#ffffff",
//                 height: "76px",
//                 padding: "0 28px",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 boxSizing: "border-box",
//                 boxShadow: "0 2px 12px rgba(0, 0, 0, 0.16)",
//                 zIndex: 1100,
//                 position: "relative",
//             }}
//         >
//             {/* Left - Logo and Brand */}
//             <div
//                 style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "12px",
//                 }}
//             >
//                 <img
//                     src={layersMap}
//                     alt="GeoExplorer"
//                     style={{
//                         width: "46px",
//                         height: "46px",
//                         objectFit: "contain",
//                         display: "block",
//                     }}
//                 />

//                 <div>
//                     <h1
//                         style={{
//                             margin: 0,
//                             fontSize: "21px",
//                             fontWeight: 650,
//                             letterSpacing: "-0.3px",
//                             lineHeight: "1.2",
//                         }}
//                     >
//                         GeoExplorer
//                     </h1>

//                     <p
//                         style={{
//                             margin: "3px 0 0",
//                             fontSize: "11px",
//                             color: "#62d39b",
//                             fontWeight: 500,
//                             letterSpacing: "0.2px",
//                         }}
//                     >
//                         Visualizador de Dados Geoespaciais WMS/WFS
//                     </p>
//                 </div>
//             </div>
//             <Navbar />
//             {/* Right - Project information */}
//             <div
//                 style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "14px",
//                     fontSize: "12px",
//                 }}
//             >
//                 <div
//                     style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "8px",
//                         color: "#e5e9ef",
//                     }}
//                 >
//                     <span
//                         style={{
//                             width: "8px",
//                             height: "8px",
//                             borderRadius: "50%",
//                             backgroundColor: "#39d98a",
//                             boxShadow: "0 0 8px rgba(57, 217, 138, 0.55)",
//                             display: "inline-block",
//                         }}
//                     />

//                     <span>Geoservidores Brasileiros (cornifer1.0)</span>
//                 </div>

//                 <span
//                     style={{
//                         padding: "5px 10px",
//                         borderRadius: "10px",
//                         backgroundColor: "rgba(255, 255, 255, 0.08)",
//                         border: "1px solid rgba(255, 255, 255, 0.08)",
//                         color: "#cbd5e1",
//                         fontSize: "10px",
//                         fontWeight: 500,
//                     }}
//                 >
//                     v1.0.0
//                 </span>
//             </div>

//             {/* Subtle green accent */}
//             <div
//                 style={{
//                     position: "absolute",
//                     bottom: 0,
//                     left: 0,
//                     width: "100%",
//                     height: "2px",
//                     background:
//                         "linear-gradient(90deg, #36d98a 0%, #35b8a0 45%, rgba(53, 184, 160, 0) 100%)",
//                 }}
//             />
//         </header>
//     );
// };

// export default Header;

// Header.tsx
// import layersMap from "../assets/ChatGPT Image 11 de ago. de 2026, 00_51_29.png";
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