import React from 'react'

const FlashCardCard = () => {
  return (
    <div className="min-h-[370px] border-2 border-gray-400 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 relative">
      <h1 className="text-2xl ml-3 mt-3 border-b-2 w-2/3 font-bold">
        Flash Cards For Memory
      </h1>
      <div className="relative h-full w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 mx-auto mt-3 flex flex-col flex-1">
        <img src='./FlashcardPage.png' className='w-full h-full object-fill'/>
      </div>
    </div>
  )
}
export default FlashCardCard