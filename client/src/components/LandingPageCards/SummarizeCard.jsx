// import React from 'react'

// const SummarizeCard = () => {
//   return (
//     <div className="flex-1 min-h-[370px] overflow-hidden border-2 border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 flex flex-col">
//       <h1 className="text-2xl ml-3 mt-3 border-b-2 w-2/3 font-bold">Summarize With Ease</h1>
//       <div className="relative w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 mx-auto mt-3 flex flex-col flex-1">
//         {/* <div className="h-5 bg-gray-300 dark:bg-gray-800 w-1/2 rounded"></div>
//         <div className="bg-gray-200 dark:bg-gray-700 rounded mt-4 flex-1"></div> */}
//         <img src='./SummaryPage.png' className='w-full h-full object-cover'/>
//         <div className="absolute border-2 border-rose-300 dark:border-gray-600 rounded-lg bg-rose-50 dark:bg-gray-900 sm:top-16 sm:-right-0 top-10 -right-0">
//           <h1 className="p-2">Upload a PDF</h1>
//         </div>
//         <div className="absolute border-2 border-rose-300 dark:border-gray-600 rounded-lg bg-rose-50 dark:bg-gray-900 sm:top-64 sm:-right-0 top-48 -right-0 ">
//           <h1 className="p-2">Save your summaries</h1>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default SummarizeCard

import React from 'react'

const SummarizeCard = () => {
  return (
    <div className="flex-1 min-h-[370px] overflow-hidden border-2 border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 flex flex-col">
      <h1 className="text-2xl ml-3 mt-3 border-b-2 w-2/3 font-bold">Summarize With Ease</h1>
      <div className="relative w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 mx-auto mt-3 flex flex-col flex-1">
        {/* Image */}
        <img src='./SummaryPage.png' className='w-full h-full object-cover' alt="Summary Page" />
        
        {/* Buttons container */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-between gap-4 px-3">
          {/* Upload a PDF */}
          <div className="border-2 border-rose-300 dark:border-gray-600 rounded-lg bg-rose-50 dark:bg-gray-900 p-2 flex-1 text-center">
            <h1>Upload a PDF</h1>
          </div>

          {/* Save your summaries */}
          <div className="border-2 border-rose-300 dark:border-gray-600 rounded-lg bg-rose-50 dark:bg-gray-900 p-2 flex-1 text-center">
            <h1>Save your summaries</h1>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummarizeCard


