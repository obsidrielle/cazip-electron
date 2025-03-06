"use client"

import { useState } from "react"
import { FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Slider } from "./ui/slider"
import { Checkbox } from "./ui/checkbox"
import path from "path-browserify"

interface CompressDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedFiles: string[]
}

export function CompressDialog({ isOpen, onClose, selectedFiles }: CompressDialogProps) {
  const [archiveName, setArchiveName] = useState("archive.zip")
  const [archiveType, setArchiveType] = useState("zip")
  const [compressionLevel, setCompressionLevel] = useState(5)
  const [savePath, setSavePath] = useState(() => {
    return window.electron.fs.getUserHome()
  })

  const handleBrowse = async () => {
    const selectedPath = await window.electron.dialog.openDirectory()
    if (selectedPath) {
      setSavePath(selectedPath)
    }
  }

  const handleCompress = () => {
    // In a real app, this would trigger the compression process
    console.log("Compressing", selectedFiles, "to", path.join(savePath, archiveName))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Archive</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="archive-name" className="text-right">
              Archive Name:
            </Label>
            <div className="col-span-3">
              <Input id="archive-name" value={archiveName} onChange={(e) => setArchiveName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="archive-type" className="text-right">
              Archive Type:
            </Label>
            <div className="col-span-3">
              <Select value={archiveType} onValueChange={setArchiveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select archive type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zip">ZIP</SelectItem>
                  <SelectItem value="7z">7Z</SelectItem>
                  <SelectItem value="rar">RAR</SelectItem>
                  <SelectItem value="tar">TAR</SelectItem>
                  <SelectItem value="tar.gz">TAR.GZ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="save-path" className="text-right">
              Save to:
            </Label>
            <div className="col-span-3 flex">
              <Input id="save-path" value={savePath} onChange={(e) => setSavePath(e.target.value)} className="flex-1" />
              <Button variant="outline" className="ml-2" onClick={handleBrowse}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="compression-level" className="text-right">
              Compression:
            </Label>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Store</span>
                <Slider
                  id="compression-level"
                  min={0}
                  max={9}
                  step={1}
                  value={[compressionLevel]}
                  onValueChange={(value) => setCompressionLevel(value[0])}
                  className="flex-1"
                />
                <span className="text-sm">Maximum</span>
              </div>
              <div className="text-center text-sm text-muted-foreground mt-1">
                Level {compressionLevel}:{" "}
                {compressionLevel < 3 ? "Faster" : compressionLevel > 6 ? "Smaller" : "Balanced"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Options:</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="create-sfx" />
                <Label htmlFor="create-sfx">Create self-extracting archive</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="password-protect" />
                <Label htmlFor="password-protect">Password protect</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="split-volumes" />
                <Label htmlFor="split-volumes">Split into volumes</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Selected Files:</Label>
            <div className="col-span-3">
              <div className="text-sm text-muted-foreground">{selectedFiles.length} file(s) selected</div>
              <div className="mt-1 max-h-20 overflow-y-auto text-sm border rounded p-2">
                {selectedFiles.map((file, index) => (
                  <div key={index}>{file}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCompress}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

