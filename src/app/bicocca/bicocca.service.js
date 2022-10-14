const fs = require('fs')
const archiver = require('archiver');

const { bicoccaModel } = require('./bicocca.model');
const ZipFile = require('../../core/zipfile');
class BicoccaService {
    checkFilePresence(fileName) {
        if (!fs.existsSync(`${bicoccaModel.videoPath}/${fileName}`)) {
            return false
        }
        return true
    }

    async zipContent(fileName) {
        //check if zip exists, if exist delete it
        const zipPath = `${__dirname}/../../zipCourse/`
        const zipName = `${fileName}`
        if(fs.existsSync(`${zipPath}${zipName}`)){
            fs.rm(zipName)
        }
        
        const zipFile = new ZipFile(zipPath,zipName)
        zipFile.addDirectoryToZip(`${bicoccaModel.videoPath}/${fileName}/`, fileName)
        await zipFile.close()
        return {zipPath:zipPath, zipName:zipName}
    }
}

module.exports = BicoccaService