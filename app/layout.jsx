import './globals.css';

export const metadata = {
  title: 'Autumn Projector',
  description: 'Umbrellas and autumn leaves flying out of a projector, in 3D.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
