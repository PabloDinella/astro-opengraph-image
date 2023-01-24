import type { AstroIntegration } from "astro";
export default function astroOGImage({ config, }: {
    config: {
        path: string;
    };
}): AstroIntegration;
