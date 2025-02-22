import type { ClusterSMIOutput } from '../types';

const rawValid = `
[2JSat Feb 15 21:53:41 2025 (http://github.com/patwie/cluster-smi)
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| Node  | Gpu                          | Memory-Usage                    | GPU-Util | Fan   | Temp  | Power | PID    | User  | Command  | GPU Mem    | Runtime                 |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node1 | 0:NVIDIA GeForce GTX 1080 Ti |    5328 MiB / 11264 MiB ( 47 %) |   27 %   |  54 % |  66 C | 142W  |  12345 | user1 | process1 |  5026 MiB  |            30 min 5 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       |                              |                                 |          |       |       |       |  23456 | user2 | process2 |   302 MiB  |                  10 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       | [0;32m1:NVIDIA GeForce GTX 1080 Ti[0m |      80 MiB / 11264 MiB ( 86 %) |    0 %   |  21 % |  43 C |  67W  |        |       |          |            |                         |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node2 | 0:NVIDIA RTX A6000           |    1541 MiB / 49140 MiB (  3 %) |   19 %   |  34 % |  50 C |  62W  |  34567 | user3 | process3 |   1541 MiB |        1 h 32 min 4 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       | 1:NVIDIA RTX A6000           |     100 MiB / 49140 MiB (  0 %) |    1 %   |  22 % |  43 C |  78W  | 891011 | root  |          |     10 MiB | 138 d 21 h 20 min 1 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node3 | [0;32m0:NVIDIA GeForce RTX 2080 Ti[0m |      80 MiB / 11264 MiB (  0 %) |    0 %   |  31 % |  31 C |  55W  |        |       |          |            |                         |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       | [0;32m1:NVIDIA GeForce RTX 2080 Ti[0m |      80 MiB / 11264 MiB (  0 %) |    0 %   |  35 % |  29 C |  61W  |        |       |          |            |                         |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
`;

const parsedValid: ClusterSMIOutput = {
   timestamp: new Date('Sat Feb 15 21:53:41 2025'),
   nodes: [
      {
         hostname: 'node1',
         devices: [
            {
               id: 0,
               name: 'NVIDIA GeForce GTX 1080 Ti',
               memory: { used: 5328, total: 11264, percentage: 47 },
               utilization: 27,
               fanSpeed: 54,
               temperature: 66,
               powerUsage: 142,
               processes: [
                  {
                     pid: 12345,
                     username: 'user1',
                     name: 'process1',
                     usedGpuMemory: 5026,
                     runtime: { days: 0, hours: 0, minutes: 30, seconds: 5 },
                  },
                  {
                     pid: 23456,
                     username: 'user2',
                     name: 'process2',
                     usedGpuMemory: 302,
                     runtime: { days: 0, hours: 0, minutes: 0, seconds: 10 },
                  },
               ],
            },
            {
               id: 1,
               name: 'NVIDIA GeForce GTX 1080 Ti',
               memory: { used: 80, total: 11264, percentage: 86 },
               utilization: 0,
               fanSpeed: 21,
               temperature: 43,
               powerUsage: 67,
               processes: [],
            },
         ],
      },
      {
         hostname: 'node2',
         devices: [
            {
               id: 0,
               name: 'NVIDIA RTX A6000',
               memory: { used: 1541, total: 49140, percentage: 3 },
               utilization: 19,
               fanSpeed: 34,
               temperature: 50,
               powerUsage: 62,
               processes: [
                  {
                     pid: 34567,
                     username: 'user3',
                     name: 'process3',
                     usedGpuMemory: 1541,
                     runtime: { days: 0, hours: 1, minutes: 32, seconds: 4 },
                  },
               ],
            },
            {
               id: 1,
               name: 'NVIDIA RTX A6000',
               memory: { used: 100, total: 49140, percentage: 0 },
               utilization: 1,
               fanSpeed: 22,
               temperature: 43,
               powerUsage: 78,
               processes: [
                  {
                     pid: 891011,
                     username: 'root',
                     name: '',
                     usedGpuMemory: 10,
                     runtime: { days: 138, hours: 21, minutes: 20, seconds: 1 },
                  },
               ],
            },
         ],
      },
      {
         hostname: 'node3',
         devices: [
            {
               id: 0,
               name: 'NVIDIA GeForce RTX 2080 Ti',
               memory: { used: 80, total: 11264, percentage: 0 },
               utilization: 0,
               fanSpeed: 31,
               temperature: 31,
               powerUsage: 55,
               processes: [],
            },
            {
               id: 1,
               name: 'NVIDIA GeForce RTX 2080 Ti',
               memory: { used: 80, total: 11264, percentage: 0 },
               utilization: 0,
               fanSpeed: 35,
               temperature: 29,
               powerUsage: 61,
               processes: [],
            },
         ],
      },
   ],
};

const rawInvalidColCount = `
[2JSat Feb 15 21:53:41 2025 (http://github.com/patwie/cluster-smi)
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| Node  | Gpu                          | Memory-Usage                    | GPU-Util | Fan   | Temp  | Power | PID    | User  | Command  | GPU Mem    | Runtime                 |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node1 | 0:NVIDIA GeForce GTX 1080 Ti |    5328 MiB / 11264 MiB ( 47 %) |   27 %   |  54 % |  66 C | 142W  |  12345 | user1 | process1 |  5026 MiB  |            30 min 5 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       |                              |                                 |          |       |       |       |  23456 | user2 | process2 |   302 MiB  |                  10 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       | [0;32m1:NVIDIA GeForce GTX 1080 Ti[0m |      80 MiB / 11264 MiB ( 86 %) |    0 %   |  21 % |  43 C |  67W  |        |       |          |            |                         |            |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node2 | 0:NVIDIA RTX A6000           |    1541 MiB / 49140 MiB (  3 %) |   19 %   |  34 % |  50 C |  62W  |  34567 | user3 | process3 |   1541 MiB |        1 h 32 min 4 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       | 1:NVIDIA RTX A6000           |     100 MiB / 49140 MiB (  0 %) |    1 %   |  22 % |  43 C |  78W  | 891011 | root  |          |     10 MiB | 138 d 21 h 20 min 1 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node3 | [0;32m0:NVIDIA GeForce RTX 2080 Ti[0m |      80 MiB / 11264 MiB (  0 %) |    0 %   |  31 % |  31 C |  55W  |        |       |          |            |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       | [0;32m1:NVIDIA GeForce RTX 2080 Ti[0m |      80 MiB / 11264 MiB (  0 %) |    0 %   |  35 % |  29 C |  61W  |        |       |          |            |                         |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
`;

const rawUnexpectedEmptyFields = `
[2JSat Feb 15 21:53:41 2025 (http://github.com/patwie/cluster-smi)
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| Node  | Gpu                          | Memory-Usage                    | GPU-Util | Fan   | Temp  | Power | PID    | User  | Command  | GPU Mem    | Runtime                 |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node1 | 0:NVIDIA GeForce GTX 1080 Ti |                                 |   27 %   |  54 % |  66 C | 142W  |  12345 | user1 | process1 |  5026 MiB  |            30 min 5 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       |                              |                                 |          |       |       |       |        | user2 | process2 |   302 MiB  |                  10 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       |                              |      80 MiB / 11264 MiB ( 86 %) |    0 %   |  21 % |  43 C |  67W  |        |       |          |            |                         |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node2 | 0:NVIDIA RTX A6000           |    1541 MiB / 49140 MiB (  3 %) |   19 %   |       |  50 C |  62W  |  34567 | user3 | process3 |   1541 MiB |        1 h 32 min 4 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       | 1:NVIDIA RTX A6000           |     100 MiB / 49140 MiB (  0 %) |          |  22 % |  43 C |  78W  | 891011 | root  |          |     10 MiB | 138 d 21 h 20 min 1 sec |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
| node3 | [0;32m0:NVIDIA GeForce RTX 2080 Ti[0m |      80 MiB / 11264 MiB (  0 %) |    0 %   |  31 % |  31 C |  55W  |        |       |          |            |                         |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
|       |                              |      80 MiB / 11264 MiB (  0 %) |    0 %   |  35 % |  29 C |  61W  |        |       |          |            |                         |
+-------+------------------------------+---------------------------------+----------+-------+-------+-------+--------+-------+----------+------------+-------------------------+
`;

export const testData = {
   valid: { raw: rawValid, parsed: parsedValid },
   invalidColCount: { raw: rawInvalidColCount, invalidLineCount: 2 },
   unexpectedEmptyFields: { raw: rawUnexpectedEmptyFields, invalidLineCount: 6 },
} as const;
