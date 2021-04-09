import * as cv from 'opencv4nodejs'
import * as math from 'mathjs'
console.log("test", cv.version)

// http://wolframlanguagereviews.org/2018/10/21/pokemon-card-detector/
// https://web.stanford.edu/class/cs231m/projects/final-report-rabet.pdf

const getRotatedPoint = (point: cv.Point2, r: cv.Point2, angle: number): cv.Point2 => {
    const p = [point.x, point.y]
    const p0 = [r.x, r.y]
    const R = math.matrix([
        [math.cos(angle), math.sin(angle)],
        [math.sin(angle)*-1, math.cos(angle)]
    ])
    const res = math.add(math.multiply(math.subtract(p, p0), R), p0)
    return new cv.Point2(res[0], res[1])
}

const start = async () => {
    try {
        const img = await cv.imreadAsync('./test-images/ChewtleBase.jpg')
        const img2 = await img.copyAsync()
        const imgGray = await img.cvtColorAsync(cv.COLOR_BGR2GRAY)
        await cv.imwriteAsync('temp/gray.jpg', imgGray)
        const thresh = await imgGray.thresholdAsync(160, 255, 0)
        await cv.imwriteAsync('temp/tresh.jpg', thresh)
        const cont = await thresh.bitwiseNot().findContoursAsync(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
        console.log(cont.length)
        
        const contours = cont.sort((c0, c1) => c1.area - c0.area);
        const imgContours = contours.map((contour) => {
                return contour.getPoints();
            })
        console.log(contours[0].minAreaRect().angle)
        const min = contours[0].minAreaRect()
        const points = [
            new cv.Point2(min.center.x - min.size.width/2, min.center.y + min.size.height/2),
            new cv.Point2(min.center.x + min.size.width/2, min.center.y + min.size.height/2),
            new cv.Point2(min.center.x + min.size.width/2, min.center.y - min.size.height/2),
            new cv.Point2(min.center.x - min.size.width/2, min.center.y - min.size.height/2)
        ]
        const points2 = points.map(p => getRotatedPoint(p, min.center, min.angle))
        points.forEach(p => img.drawCircle(p, 70, new cv.Vec3(0, 0, 255), 30))
        points2.forEach(p => img.drawCircle(p, 70, new cv.Vec3(0, 255, 0), 30))
        img.drawCircle(min.center, 70, new cv.Vec3(0, 255, 0), 30)
        img.drawRectangle(min.boundingRect(), new cv.Vec3(0, 0, 255), 30)
        img.

        //img.drawPolylines(points, true, new cv.Vec3(0, 255, 0), 30)
        //imgContours[0].forEach(p => img.drawCircle(p, 70, new cv.Vec3(0, 0, 255), 30))
        // @ts-ignore
        img.drawContours([imgContours[0]], -1, new cv.Vec3(0, 0, 255), 2)
        await cv.imwriteAsync('temp/img.jpg', img)
        //cont.forEach(c => img.drawRectangle(c.boundingRect(), new cv.Vec3(255, 0, 0), 10))
        

        const dst = await imgGray.cornerHarrisAsync(2, 3, 0.04)
        //console.log(JSON.stringify(dst))
        //dst > 0.01 * dst.max()
        await cv.imwriteAsync('temp/img2.jpg', dst)
        //console.log(cont.slice(0, 10))
      } catch (err) {
        console.error(err);
      }
}

start()