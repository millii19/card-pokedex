import * as cv from 'opencv4nodejs'

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