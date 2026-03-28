// src/components/common/TijaraLogo.js
import React from "react";
import Svg, { Path } from "react-native-svg";

const TijaraLogo = ({ width = 120, height = 200 }) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 93 163"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Bottom black shape */}
      <Path
        d="M36.4576 70.8062H0.6026C0.6026 84.6661 6.74918 117.689 31.3355 138.901C55.9218 160.112 82.1553 163.005 92.1987 161.8V127.752C50.7394 123.414 37.7633 87.9805 36.4576 70.8062Z"
        fill="#000000"
      />

      {/* Yellow band */}
      <Path
        d="M92.5 35.855H36.4577L0.742886 70.3892C0.471217 70.6518 0.655461 71.1118 1.03335 71.1142L92.5 71.7101V35.855Z"
        fill="#FEC20E"
      />

      {/* Top black block */}
      <Path
        d="M36.759 0.3013H2.10912V36.1563H35.855C36.3543 36.1563 36.759 35.7517 36.759 35.2524V0.3013Z"
        fill="#000000"
      />
    </Svg>
  );
};

export default TijaraLogo;