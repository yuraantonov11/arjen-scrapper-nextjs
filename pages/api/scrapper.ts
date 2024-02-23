import puppeteer, {Browser, Page} from 'puppeteer-core';
import xml2js from 'xml2js';
import axios from 'axios';
import chromium from "@sparticuz/chromium";
import {CsvWriter} from "csv-writer/src/lib/csv-writer";
import {ObjectMap} from "csv-writer/src/lib/lang/object";

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const {ARJEN_EMAIL, ARJEN_PASSWORD, SKIP_LOGIN} = process.env;

interface IProduct {
    id: string;
    code: string;
    title: string;
    category: string;
    description: string | null;
    composition: string | null;
    material: string | null;
    price: string;
    oldPrice: string | null;
    cost: string;
    discount: string;
    color: string;
    images: string[]; // Array of strings
    availability?: string; // Optional property
    inventory?: number; // Optional property
    size?: string; // Optional property
}


interface IColor {
    name: string;
    picture: string;
    rakurs: string[];
    sizes: ISize[];
}

interface ISize {
    name: string;
    availability?: string;
    quantity: number;
    inventory?: number;
    status: string;
}

interface ISizeXML {
    color_size_name: string[];
    color_size_quantity: string[];
    color_size_status: string[];
}

interface ColorXML {
    color_name: string;
    color_picture: string;
    color_rakurs: string[];
    color_sizes: [{ color_size: ISizeXML[] }];
}

interface ProductXML {
    $: { id: string };
    colors: { color: IColor[] };
}


interface IProductData {
    id: string;
    code: string;
    title: string;
    category: string;
    description: string;
    composition: string;
    material: string;
    price: string;
    oldPrice: string;
    cost: string;
    discount: string;
    color: string;
    images: string[];
    availability: string;
    inventory: number;
    quantity: number;
    size: string;
}
class Product {
    id: string;
    code: string;
    title: string;
    category: string;
    description: string | null;
    composition: string | null;
    material: string | null;
    price: string;
    oldPrice: string | null;
    cost: string;
    discount: string;
    color: string;
    images: string[];
    availability?: string;
    inventory?: number;
    size?: string;

    constructor({
                    id,
                    code,
                    title,
                    category,
                    description,
                    composition,
                    material,
                    price,
                    oldPrice,
                    cost,
                    discount,
                    color,
                    images,
                    availability,
                    inventory,
                    size,
                }: IProductData) {
        this.id =  id;
        this.code = code;
        this.title =  title;
        this.category =  category;
        this.description = description;
        this.composition = composition;
        this.material =  material;
        this.price =  price;
        this.oldPrice = oldPrice;
        this.cost =  cost;
        this.discount = discount;
        this.color =  color;
        this.images =  images;
        this.availability = availability;
        this.inventory = inventory;
        this.size = size;
    }
}


class ProductDetailsScraper {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async login(email: string, password: string): Promise<void> {
        try {
            console.log('Проводимо вхід...')
            await this.page.evaluate(({email, password}) => {
                const emailInput: HTMLInputElement = document.querySelector("#login_tab input[name=email]");
                emailInput.value = email;

                const passwordInput: HTMLInputElement = document.querySelector("#passi")
                passwordInput.value = password;

                const button: HTMLInputElement = document.querySelector('#go_login');
                button.click()
            }, {email, password})

            await this.page.waitForNavigation({waitUntil: "load"});
            await this.page.waitForSelector('#hoverclient', {
                timeout: 10000
            });
            console.log('Вхід виконано!')
        } catch (e) {
            console.error(`Вхід не виконано: ${e}`);
        }
    }

    async findOption(tableSelector: string, optionName: string): Promise<string> {
        return await this.page.$$eval(tableSelector, (rows, optionName) => {
            let value = null;
            rows.forEach(row => {
                if (row && row.textContent.includes(optionName)) {
                    value = row.querySelector('td:nth-of-type(3)').textContent.trim();
                }
            })
            return value
        }, optionName);
    }



    async extractProductData(link: string): Promise<IProduct[] | []> {
        const PRODUCT_DATA_SELECTORS = [
            '#buy_price',
            '#p_code',
            '#p_title',
            '#p_right_desc',
            '#p_left',
            '.p_item.active table',
            '.breadcrumbs > span:nth-of-type(3) span',
            '#p_price .val',
            '#p_old',
            '#c_price_right .val',
            '#percent',
            '#c_price',
            '#select_r_list_new',
        ];
        await this.page.goto(link, {
            waitUntil: 'load',
            timeout: 60000
        });

        await this.page.waitForSelector(PRODUCT_DATA_SELECTORS.join(', '));

        try {

            // Extract product data using page selectors and methods
            const code = await this.page.$eval('#p_code', el => el.textContent.trim().match(/\d+/g)[0] || null);
            const title = await this.page.$eval('#p_title', el => el.textContent.trim() || '');
            const description = await this.page.$eval('#p_right_desc', el => el.textContent.trim().replaceAll('\n', '').replaceAll('"', '\'') || '');


            const composition = await this.findOption('.p_item.active table tr', 'Склад');
            const material = await this.findOption('.p_item.active table tr', 'Матеріал');

            const price = await this.page.$eval('#p_price .val', el => el.textContent.trim() || '');

            let oldPrice = null;
            try {
                oldPrice = await this.page.$eval('#p_old .val', el => el.textContent.trim() || '');
            } catch (e) {
            }
            const costElement = await this.page.$('#c_price_right .val');

            const cost = costElement ? await this.page.evaluate(el => el.textContent.trim() || '', costElement) : null;

            // const discountElement = await page.$('#c_price');
            const discountElement = await this.page.$('#percent');
            const discount = discountElement ? await this.page.evaluate(el => el.textContent.trim() || '', discountElement) : null;

            const category = await this.page.$eval('.breadcrumbs > span:nth-of-type(5) span', el => el.textContent.trim() || '');

            // const sizes = Array.from(new Set(Array.from(document.querySelectorAll('#select_r_list_new .razmer_new .r_left1_new')).map(priceElement => priceElement.textContent.trim())));

            const productId = await this.page.$eval('#buy_price', productIdElement => productIdElement.getAttribute('data-product_id'));

            const productColors: Map<string, IColor> = productCatalogScraper.getProductColorsFromXML(productId);

            // const {color, images} = await this.extractProductColors();
            const products: IProduct[] = [];
            let sizeIndex = 1;


            productColors?.forEach((colorValue:IColor, color) => {
                let isFirstIteration = true;
                colorValue.sizes.forEach(async ({status, name, quantity}) => {
                    console.log('isFirstIteration:', isFirstIteration);
                    const images = [colorValue.picture, ...colorValue.rakurs];
                    const availability = status === 'Есть в наличии' ? 'in stock' : 'out of stock';
                    const size = name;
                    const id = link.match(/-(\d+-\d+)\//)[1] + '-' + sizeIndex++
                    isFirstIteration = false;

                        // images: isFirstIteration ? [colorValue.picture, ...colorValue.rakurs] : '',
                        // description: isFirstIteration ? productData.description : '',

                    products.push(new Product({
                        id,
                        title,
                        code,
                        category,
                        description,
                        composition,
                        material,
                        price,
                        oldPrice,
                        cost,
                        discount,
                        color,
                        images,
                        availability,
                        inventory: quantity,
                        quantity,
                        size
                    }))
                })
            });

            return products;
        } catch (error) {
            console.error(`Error extracting product data for ${link}:`, error);
            return [];
        }
    }

    // async extractProductColors(): Promise<{ color: string | null; images: string[] }> {
    //     try {
    //         const colorElementContainer = await this.page.$('.color_carousel .slick-active.slick-slide:not(.slick-cloned) div');
    //         const colorTextElement = await colorElementContainer.$('div');
    //         const color = colorTextElement ? await this.page.evaluate(el => el.textContent.trim() || '', colorDiv) : null;
    //         const colorIndex = await colorElementContainer.$eval('img', img => img.getAttribute('data-color') || 1);
    //         const images = await this.page.$$eval(
    //             `#p_left .gallery[data-color='${colorIndex}'] img.slick-slide:not(.slick-cloned)`,
    //             images => images.map(img => img.getAttribute('src').replace('100_100', '1000_1000'))
    //         );
    //         return {color, images}
    //     } catch (e) {
    //         console.log(`Colors error: ${e}`);
    //         return {color: null, images: []}
    //     }
    // }
}


class ProductCatalog {
    private readonly baseUrl: string;
    private readonly catalogUrl: string;
    private readonly xmlPath: string;
    // private productData: Product | null;
    private writer: any;
    private _browser: Browser;
    private _progress: number;
    public isRunning: boolean;
    private _productsFromXML: Map<string, Map<string, IColor>>;


    constructor(
        baseUrl: string,
        catalogUrl: string,
        xmlPath: string,
        writer: CsvWriter<ObjectMap<string>>,
        // productData: Product | null = null
    ) {
        this.baseUrl = baseUrl;
        this.catalogUrl = catalogUrl;
        this.xmlPath = xmlPath;
        this.writer = writer;
        // this.productData = productData;
        this.isRunning = false;
        this._progress = 0;
        this._productsFromXML = new Map();

    }

    optimizeColorData(colors:  ColorXML[]): IColor[] {
        if (!colors || colors.length === 0) {
            return [];
        }

        return colors.map(colorObj => {
            return {
                name: colorObj.color_name?.[0],
                picture: colorObj.color_picture?.[0],
                rakurs: colorObj.color_rakurs || [],
                sizes: colorObj.color_sizes?.[0]?.color_size?.map(sizeObj => {
                    return {
                        name: sizeObj.color_size_name?.[0],
                        quantity: parseInt(sizeObj.color_size_quantity?.[0] || '0'),
                        status: sizeObj.color_size_status?.[0],
                    };
                }) || [],
            };
        });
    }

    async fetchAndParseXML(): Promise<void> {
        try {
            const response = await axios.get(this.xmlPath);
            const data = response.data;
            const result = await xml2js.parseStringPromise(data);

            const offers = result?.yml_catalog?.shop[0]?.offers[0]?.offer || [];


            const arrayMap2: Array<[string, Map<string, IColor>]> = offers.map(({$, colors}: ProductXML) => {
                const arrayMap: [string, IColor][] = this.optimizeColorData(colors[0].color).map((colorObj) => ([
                    colorObj.name,
                    colorObj,
                ]))
                return [
                $.id,
                new Map(arrayMap)
            ]
            });
            this._productsFromXML = new Map(arrayMap2);

        } catch (err) {
            console.error('Помилка при завантаженні або розборі XML:', err);
        }
    }


    getProductColorsFromXML(productId: string): Map<string, IColor> {
        return this._productsFromXML.get(productId);
    }

    async startScraper(): Promise<void> {
        chromium.setHeadlessMode = true;
        chromium.setGraphicsMode = false;

        this.isRunning = true;
        this._browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: true,
        });
        const [page] = await this._browser.pages();
        await page.setViewport({width: 1280, height: 480, deviceScaleFactor: 1});

        await page.goto(this.baseUrl);
        const productScraper = new ProductDetailsScraper(page);

        if(!SKIP_LOGIN) await productScraper.login(ARJEN_EMAIL, ARJEN_PASSWORD);

        let currentPage = 1;
        await page.goto(`${this.catalogUrl}`);

        const pageElements = await page.$$('#pag2 .page');
        const lastPageNumber = parseInt(await (await pageElements[pageElements.length - 1].getProperty('textContent')).jsonValue());

        await this.fetchAndParseXML();

        let totalPages = lastPageNumber;
        // TODO: Implement short scrapping
        // let totalPages = 2;

        let processedPages = 0;

        while (currentPage <= lastPageNumber) {
            if (!this.isRunning) {
                break;
            }

            await page.goto(`${catalogUrl}page${currentPage}/`);

            const productPageLinks = await page.$$eval('.p_image_mix > a', elements => elements.map(element => element.href));

            await this.processProductLinks(productScraper, productPageLinks);

            console.log(`Сторінка: ${currentPage}`);
            currentPage++;
            processedPages++;

            // Update progress
            this._progress = (processedPages / totalPages) * 100;
        }

        await this.writer.writeRecords(allProducts);
        console.log('Кінець!');
        this.isRunning = false;
        await this._browser.close();
    }

    async processProductLinks(productScraper: ProductDetailsScraper, productPageLinks: string[]): Promise<void> {
        for (const link of productPageLinks) {
            try {
                const products: IProduct[] = await productScraper.extractProductData(link);
                if (products.length) {
                    allProducts = allProducts.concat(products);
                }
            } catch (err) {
                console.warn(`Помилка при обробці посилання ${link}:`, err);
            }
        }
    }

    async stopScraper(): Promise<void> {
        this.isRunning = false;
        await this._browser?.close();
    }

    get progress(): number {
        return this._progress;
    }

}

const baseUrl = 'https://arjen.com.ua/';
const catalogUrl = `${baseUrl}katalog/`;
const xml_path = `${baseUrl}prices/xml.php/`;
let allProducts: IProduct[] = [];


const csvConfig = {
    path: 'static/output.csv',
    header: [
        {id: 'id', title: 'ID'},
        {id: 'code', title: 'Code'},
        {id: 'title', title: 'Title'},
        {id: 'description', title: 'Description'},
        {id: 'category', title: 'Category'},
        {id: 'composition', title: 'Composition'},
        {id: 'material', title: 'Material'},
        {id: 'color', title: 'Color'},
        {id: 'size', title: 'Size'},
        {id: 'images', title: 'Images'},
        {id: 'price', title: 'Price'},
        {id: 'oldPrice', title: 'oldPrice'},
        {id: 'cost', title: 'Cost'},
        {id: 'discount', title: 'Discount'},
        {id: 'availability', title: 'availability'},
        {id: 'inventory', title: 'inventory'},
    ],
};

const csvWriter: CsvWriter<ObjectMap<string>> = createCsvWriter(csvConfig);


const productCatalogScraper = new ProductCatalog(baseUrl, catalogUrl, xml_path, csvWriter);


export default async function handler(req: any, res: any): Promise<void> {
    if (req.method === 'POST') {
        const {action} = JSON.parse(req.body);

        if (action === 'start') {
            try {
                if (!productCatalogScraper.isRunning) {
                    productCatalogScraper.startScraper().catch(console.error);

                    // Send initial progress and status
                    res.status(200).json({
                        progress: productCatalogScraper.progress,
                        isRunning: productCatalogScraper.isRunning
                    });
                } else {
                    res.status(400).json({error: 'Scrapper is already running'});
                }
            } catch (error) {
                console.error('Error starting scraper:', error);
                res.status(500).json({error: 'Failed to start scraper'});
            }
        } else if (action === 'stop') {
            await productCatalogScraper.stopScraper();
            res.status(200).json({isRunning: productCatalogScraper.isRunning});
        } else {
            res.status(400).json({error: 'Invalid action'});
        }
    } else if (req.method === 'GET') {
        res.status(200).json({
            progress: productCatalogScraper.progress,
            isRunning: productCatalogScraper.isRunning
        });

    } else {
        res.status(405).json({error: 'Method not allowed'});
    }
}
