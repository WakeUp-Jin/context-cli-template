import { InternalTool } from "../types";
import { readFileExecutor } from "./executors";
import { renderResultForAssistant } from "./executors";
import { ReadFileArgs, ReadFileResult } from "./executors";

export const ReadFileTool: InternalTool<ReadFileArgs, ReadFileResult> = {
  name: 'read_file',
  category: 'filesystem',
  internal: true,
  description: '读取指定文件的内容。支持文本文件，返回文件内容、大小和行数。',
  version: '1.0.0',
  parameters: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: '要读取的文件路径',
      },
      encoding: {
        type: 'string',
        description: '文件编码，默认为 utf-8',
      },
    },
    required: ['filePath'],
  },
  handler: readFileExecutor,
  renderResultForAssistant: renderResultForAssistant,
};

