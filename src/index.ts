import * as fs from "fs";
import puppeteer from "puppeteer";
import { fileURLToPath } from "node:url";
import type { AstroIntegration, RouteData } from "astro";
import matter from "gray-matter";
import dayjs from "dayjs";

export default function astroOGImage({
  config,
}: {
  config: { path: string };
}): AstroIntegration {
  return {
    name: "astro-og-image",
    hooks: {
      "astro:build:setup": async (options) => {},

      "astro:build:done": async ({ dir, routes }) => {
        const filteredRoutes = routes.filter((route) => {
          return /^src\/pages\/publicacoes\/.+\.md/.test(route.component);
        });
        console.log(filteredRoutes);

        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const template = fs.readFileSync("og-image.html", "utf-8").toString();

        await Promise.all(
          filteredRoutes.map(async (route) => {
            const data = await fs.promises.readFile(route.component, {
              encoding: "utf-8",
            });

            const frontmatter = matter(data).data;
            console.log(route);

            console.log("frontmatter: ", frontmatter);

            const templateApplied = Object.keys(frontmatter).reduce(
              (html, property) => {
                const value =
                  property !== "date"
                    ? frontmatter[property]
                    : dayjs(frontmatter[property]).format("DD/MM/YYYY");

                return html.replace(`@${property}`, value);
              },
              template
            );

            const page = await browser.newPage();
            await page.setContent(templateApplied);
            await page.waitForNetworkIdle();
            await page.setViewport({
              width: 1200,
              height: 630,
            });

            console.log(
              new URL(
                `./assets${route.route.replace("/publicacoes", "")}.png`,
                dir
              )
            );

            await page.screenshot({
              path: fileURLToPath(
                new URL(
                  `./assets${route.route.replace("/publicacoes", "")}.png`,
                  dir
                )
              ),
              encoding: "binary",
            });
          })
        );

        await browser.close();

        return;

        // let path = config.path;
        // // Filters all the routes that need OG image
        // let filteredRoutes = routes.filter((route: RouteData) =>
        //   route?.component?.includes(path)
        // );

        // // Creates a directory for the images if it doesn't exist already
        // let directory = fileURLToPath(new URL(`./assets/${path}`, dir));
        // if (!fs.existsSync(directory)) {
        //   fs.mkdirSync(directory);
        // }

        // const browser = await puppeteer.launch({
        //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
        // });
        // for (const route of filteredRoutes) {
        //   // Gets the title
        //   const pathname = route?.distURL?.pathname;
        //   // Skip URLs that have not been built (draft: true, etc.)
        //   if (!pathname) {
        //     continue;
        //   }

        //   console.log(pathname);

        //   const data = fs.readFileSync(pathname as any, "utf-8") as any;

        //   let title = await data.match(/<title[^>]*>([^<]+)<\/title>/)[1];
        //   let author = await data.match(/<author[^>]*>([^<]+)<\/author>/)?.[1];

        //   // Get the html
        //   const html = fs
        //     .readFileSync("og-image.html", "utf-8")
        //     .toString()
        //     .replace("@title", title)
        //     .replace("@author", author);

        //   const page = await browser.newPage();
        //   await page.setContent(html);
        //   await page.waitForNetworkIdle();
        //   await page.setViewport({
        //     width: 1200,
        //     height: 630,
        //   });

        //   console.log(new URL(`./assets/${pathname.split("/").at(-2)}.png`, dir));

        //   await page.screenshot({
        //     path: fileURLToPath(
        //       new URL(`./assets/${pathname.split("/").at(-2)}.png`, dir)
        //     ),
        //     encoding: "binary",
        //   });
        // }
        // await browser.close();
      },
    },
  };
}
