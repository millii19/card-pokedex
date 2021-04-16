import * as cv from 'opencv4nodejs'
import * as math from 'mathjs'
import { getContours } from '../contours'

const getRotatedPoint = (point: cv.Point2, r: cv.Point2, angle: number): cv.Point2 => {
    const p = [point.x, point.y]
    const p0 = [r.x, r.y]
    angle = angle*math.pi/180
    const R = math.matrix([
        [math.cos(angle), math.sin(angle)],
        [math.sin(angle)*-1, math.cos(angle)]
    ])
    const res = math.add(math.multiply(math.subtract(p, p0), R), p0) as unknown as math.Matrix
    const resArray = res.toArray() as Array<number>
    return new cv.Point2(resArray[0], resArray[1])
}

export const getRotatedRect = (contour: cv.Contour) => {
    const min = contour.minAreaRect()
        const points = [
            new cv.Point2(min.center.x - min.size.width/2, min.center.y + min.size.height/2),
            new cv.Point2(min.center.x + min.size.width/2, min.center.y + min.size.height/2),
            new cv.Point2(min.center.x + min.size.width/2, min.center.y - min.size.height/2),
            new cv.Point2(min.center.x - min.size.width/2, min.center.y - min.size.height/2)
        ]
        
        return points.map(p => getRotatedPoint(p, min.center, min.angle))
}

export const detectRotatedRect = async (image: cv.Mat) => {
    const contours = await getContours(image)
    return getRotatedRect(contours[0])
}