import { InternalTool } from "../types";
import { listFilesExecutor } from "./executors";
import { renderResultForAssistant } from "./executors";
import { ListFilesArgs, ListFilesResult } from "./executors";


export const ListFilesTool: InternalTool<ListFilesArgs, ListFilesResult> = {
    name: 'list_files',
    category: 'filesystem',
    internal: true,
    description: '列出指定目录下的文件和文件夹。如果不指定目录，则列出当前工作目录。',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: '要列出内容的目录路径，默认为当前工作目录',
        },
      },
      required: [],
    },
    handler: listFilesExecutor,
    renderResultForAssistant: renderResultForAssistant,
  };