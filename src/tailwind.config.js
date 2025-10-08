import { color } from 'framer-motion';
import { b } from 'framer-motion/client';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
        fontFamily: {
            sans: [
                "-apple-system",
                "SF Pro Text",
                "Inter",
                "system-ui",
                "Segoe UI",
                "Roboto",
                "Helvetica Neue",
                "Arial",
                "sans-serif"
            ]
        },
        colors: {
            "glass-white": "rgba(255, 255, 255, 0.6)",
            "glass-dark": "rgba(15, 15, 17, 0.6)"
        },
        backdropBlur: {
            xs: '2px'
        },
        boxShadow: {
            'soft-lg': '0 10px 40px -12px rgba(0, 0, 0, 0.12)'
        }

    }
    },
    plugins: []
};