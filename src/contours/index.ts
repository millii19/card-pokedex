import * as cv from 'opencv4nodejs'
import * as math from 'mathjs'

export const getContours = async (image: cv.Mat) => {
    const imgGray = await image.cvtColorAsync(cv.COLOR_BGR2GRAY)
    const thresh = await imgGray.thresholdAsync(160, 255, 0)
    const contours = await thresh.bitwiseNot().findContoursAsync(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    return contours.sort((c0, c1) => c1.area - c0.area)
}

export const getDrawableContours = async (image: cv.Mat) => {
    const contours = await getContours(image)
    return contours.map((contour) => contour.getPoints())
}

export const canny = async (image: cv.Mat) => {
    const img = image.copy().getRegion(new cv.Rect(50, 50, image.cols - 100, image.rows -100))
    //const bin = new cv.Mat(image.rows, image.cols, cv.THRESH_BINARY, 0)
    const imgGray = await (await image.blurAsync(new cv.Size(10, 10)))//.cvtColorAsync(cv.COLOR_BGR2GRAY) //await image.cvtColorAsync(cv.COLOR_BGR2GRAY)
    const edges = (await imgGray.cannyAsync(0, 50)).getRegion(new cv.Rect(50, 50, image.cols - 100, image.rows -100))
    //const contours = await imgGray.findContoursAsync(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    //const contour = contours.sort((c0, c1) => c1.area - c0.area)[0]
    // @ts-ignore
    //img.drawContours([contour.getPoints()], -1, new cv.Vec3(255, 255, 255), 10)
    //await cv.imwriteAsync(`temp/${new Date().toUTCString()}.jpg`, img)
    
    const lines = await edges.houghLinesAsync(1, math.pi/270, 210)

    const grouped = segmentByAngle(lines)
    console.log(`${lines.length} = ${Object.keys(grouped).map(k => grouped[k].length)}`)
    
    grouped[0].map(line => drawLine(img, line, new cv.Vec3(0, 255, 0)))
    grouped[1].map(line => drawLine(img, line, new cv.Vec3(255, 0, 0)))

    const intersections = segmentedIntersections(grouped)
    intersections.forEach(pt => img.drawCircle(pt, 5, new cv.Vec3(0, 0, 255), 10))
    
    //image.drawLine(lines.)
    return img
}

// https://stackoverflow.com/questions/46565975/find-intersection-point-of-two-lines-drawn-using-houghlines-opencv
const segmentByAngle = (lines: cv.Vec2[], k = 2) => {
    const angles = lines.map(l => l.y)

    const pts = angles.map(a => new cv.Point2(math.cos(2*a), math.sin(2*a)))

    // @ts-ignore
    const { labels } = cv.kmeans(pts, k, new cv.TermCriteria(cv.termCriteria.EPS + cv.termCriteria.MAX_ITER, 10, 1), 10, cv.KMEANS_RANDOM_CENTERS)

    
    const segmented = {}
    lines.forEach((line, i) => {
        if (Array.isArray(segmented[labels[i]])) segmented[labels[i]].push(line)
        else segmented[labels[i]] = [line]
    })
    return segmented
}

const drawLine = (image: cv.Mat, line: cv.Vec2, color: cv.Vec3) => {
    const rho = line.x
    const theta = line.y
    const a = math.cos(theta)
    const b = math.sin(theta)
    const x0 = a*rho
    const y0 = b*rho
    const x1 = math.round(x0 + 5000*(-b))
    const y1 = math.round(y0 + 5000*(a))
    const x2 = math.round(x0 - 5000*(-b))
    const y2 = math.round(y0 - 5000*(a))
    image.drawLine(new cv.Point2(x1, y1), new cv.Point2(x2, y2), color, 20)
}

const intersection = (line1: cv.Vec2, line2: cv.Vec2) => {
    const rho1 = line1.x
    const theta1 = line1.y
    const rho2 = line2.x
    const theta2 = line2.y
    const A = math.matrix([
        [math.cos(theta1), math.sin(theta1)],
        [math.cos(theta2), math.sin(theta2)]
    ])
    const b = math.matrix([
        [rho1], 
        [rho2]
    ])
    const res = math.lusolve(A, b) as math.Matrix
    return new cv.Point2(math.round(res.toArray()[0][0] as number), math.round(res.toArray()[1][0] as number))
    //res.
    //x0, y0 = np.linalg.solve(A, b)
    //x0, y0 = int(np.round(x0)), int(np.round(y0))
    //return [[x0, y0]]
}

const segmentedIntersections = (lines: {}) => {
    const intersections: cv.Point2[] = []
    Object.keys(lines).slice(0, -1).forEach((group, i) => {
        Object.keys(lines).slice(i+1).forEach(nextGroup => {
            lines[group].forEach(line1 => {
                lines[nextGroup].forEach(line2 => {
                    intersections.push(intersection(line1, line2))
                })
            })
        })
    })

    return intersections
}
