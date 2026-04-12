import React from 'react';
import { createRoot } from 'react-dom/client';
// import LandingComponent from './components/LandingComponent';

const root = createRoot(document.getElementById('root'));
root.render(
	<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
		<h1>Landing Page</h1>
		<button
			style={{ margin: '2rem', padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '8px', background: '#137fec', color: '#fff', border: 'none', cursor: 'pointer' }}
			onClick={() => { window.location.href = '/pages/login.html'; }}
		>
			Sign In
		</button>
	</div>
);
