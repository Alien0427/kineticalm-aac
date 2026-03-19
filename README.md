# KinetiCalm

## Abstract
KinetiCalm is a browser-based Augmentative and Alternative Communication (AAC) interface designed specifically for users experiencing dyskinetic motor tremors. The system utilizes computer vision and facial landmarks to provide a hands-free, accessible method of interaction, translating real-time cranial movements into stabilized, high-precision cursor control.

## Core Architecture
The primary challenge of utilizing facial tracking for individuals with motor tremors is the introduction of high-frequency spatial jitter. KinetiCalm addresses this by implementing a specialized Simple Moving Average (SMA) algorithm. Real-time coordinate data extracted from the Google MediaPipe Face Mesh stream is buffered into a fixed-length window array. The system continually computes the mean of the buffered frame coordinates, effectively filtering out erratic coordinate spikes and translating the data into a stabilized vector path before altering the Document Object Model (DOM).

## Features
- **Dwell-to-Click Interaction**: Replaces physical input requirements with temporal intersections. Programmatic click events are triggered by holding the stabilized cursor over designated targets for a parameterized duration.
- **Web Speech API Integration**: Includes robust text-to-speech synthesis with automatic queue-flushing protocols to prevent overlapping auditory feedback and ensure instant articulation.
- **End-to-End Test Suite**: Comprehensive, headless integration testing utilizing Playwright to validate DOM layouts, test Dwell-to-Click functionality inherently despite simulated delays, and verify assertion thresholds mathematically.

## Tech Stack
- React
- Vite
- Google MediaPipe Tasks Vision
- Tailwind CSS
- Framer Motion
- Playwright

## Local Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Execute the End-to-End test suite:
   ```bash
   npx playwright test
   ```
