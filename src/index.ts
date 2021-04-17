import * as cv from 'opencv4nodejs'
import * as math from 'mathjs'
import { detectRotatedRect, getRotatedRect } from './rotatedRect'
import { canny, getDrawableContours } from './contours'
import * as path from 'path'
console.log("test", cv.version)

// http://wolframlanguagereviews.org/2018/10/21/pokemon-card-detector/
// https://web.stanford.edu/class/cs231m/projects/final-report-rabet.pdf


const processImage = async (image: cv.Mat, dest: string) => {
    console.log(`processing ${dest}`)
    //image = await image.blurAsync(new cv.Size(10, 10))
    const rr = await detectRotatedRect(image)
    const contours = await getDrawableContours(image)
    const edges = await canny(image)
    // x, y, width, height
    image.drawRectangle(new cv.Rect(50, 50, image.cols - 100, image.rows -100), new cv.Vec3(255, 0, 0), 20)
    image.drawPolylines([rr], true, new cv.Vec3(0, 255, 0), 30)
    // @ts-ignore
    image.drawContours([contours[0]], -1, new cv.Vec3(0, 0, 255), 10)
    await cv.imwriteAsync(dest, image)
    await cv.imwriteAsync(path.join(path.dirname(dest), `edge_${path.basename(dest)}`), edges)
    

}

const getName = (fullPath: string) => path.basename(fullPath)

const start = async () => {
    try {
        const files = [
            './test-images/ChewtleBase.jpg',
            './test-images/Chewtle1.jpg',
            './test-images/Chewtle2.jpg',
            './test-images/Chewtle3.jpg',
            './test-images/Chewtle4.jpg',
            './test-images/Chewtle5.jpg',
            './test-images/Chewtle6.jpg',
            './test-images/Chewtle7.jpg'
        ]
        const images = await Promise.all(files.map(f => cv.imreadAsync(f)))
        console.log(`Loaded ${images.length} images`)
        for (let i=0; i<images.length; i++) await processImage(images[i], path.join('temp', getName(files[i])))
      } catch (err) {
        console.error(err);
      }
}

start()