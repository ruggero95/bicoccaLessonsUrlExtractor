const fs = require('fs');
const archiver = require('archiver');

class ZipFile {

    static extensions = Object.freeze({
        ZIP:'zip',
        TAR:'tar'
    })

    constructor(destination, zipName, extension = ZipFile.extensions.ZIP , compression = 9) {
        // create a file to stream archive data to.
        this.output = fs.createWriteStream(`${destination}/${zipName}.${extension}`);
        this.archive = archiver(extension, {
            zlib: { level: compression } // Sets the compression level.
        });
    }

    addfileToZipFromStream(fullPathFile, filename ){
        this.archive.append(fs.createReadStream(fullPathFile), { name: filename });
        return this
    }

    addFileToZip(fullPathFile, filename){

        this.archive.file(fullPathFile, { name: filename });
        return this
    }

    addDirectoryToZip(directory, subDir = false ){
        //if subdir is false the directroy content is put into the root of zip
        this.archive.directory(directory, subDir);
        return this
    }

    async close(){
        await this.archive.finalize()
        return this
    }
}

module.exports = ZipFile