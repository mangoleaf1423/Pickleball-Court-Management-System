import React from 'react';

const Map: React.FC = () => {
  return (
    <div >
      <iframe 
        src="https://datlich.alobo.vn/" 
        width="100%" 
        height="1000px" 
        frameBorder="0"
        scrolling="no"
        style={{
          overflow: 'hidden',
          clipPath: 'inset(0 0 80px 0)'
        }}
      ></iframe>
    </div>
  );
};

export default Map; 