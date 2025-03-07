'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface AssetActionsProps {
  assetSymbol: string
  assetName: string
  userBalance?: string
  maxAmount?: string
  actionType: 'deposit' | 'withdraw' | 'borrow' | 'repay'
  onAction: (amount: string) => Promise<void>
}

export default function AssetActions({
  assetSymbol,
  assetName,
  userBalance = '0',
  maxAmount = '0',
  actionType,
  onAction,
}: AssetActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const actionTitle = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    borrow: 'Borrow',
    repay: 'Repay',
  }
  
  const actionColor = {
    deposit: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    withdraw: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    borrow: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    repay: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  }
  
  const closeModal = () => {
    setIsOpen(false)
    setAmount('')
    setError('')
  }
  
  const openModal = () => {
    setIsOpen(true)
  }
  
  const handleMaxAmount = () => {
    setAmount(maxAmount)
  }
  
  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (parseFloat(amount) > parseFloat(maxAmount)) {
      setError(`Amount exceeds maximum (${maxAmount} ${assetSymbol})`)
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      await onAction(amount)
      closeModal()
    } catch (err) {
      setError('Transaction failed. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${actionColor[actionType]} focus:outline-none focus:ring-2 focus:ring-offset-2`}
      >
        {actionTitle[actionType]}
      </button>
      
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {actionTitle[actionType]} {assetName} ({assetSymbol})
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={closeModal}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Available Balance</span>
                      <span>{userBalance} {assetSymbol}</span>
                    </div>
                    
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <input
                        type="text"
                        name="amount"
                        id="amount"
                        className={`block w-full rounded-md pr-20 focus:outline-none sm:text-sm ${
                          error 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="0.00"
                        aria-describedby="amount-currency"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <button
                          type="button"
                          className="h-full rounded-md border-transparent bg-transparent py-0 px-2 text-xs text-blue-600 hover:text-blue-500 focus:outline-none"
                          onClick={handleMaxAmount}
                        >
                          MAX
                        </button>
                        <span className="h-full rounded-md border-transparent bg-transparent py-0 pl-1 pr-3 text-gray-500 sm:text-sm" id="amount-currency">
                          {assetSymbol}
                        </span>
                      </div>
                    </div>
                    
                    {error && (
                      <p className="mt-2 text-sm text-red-600" id="amount-error">
                        {error}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className={`inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${actionColor[actionType]} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : actionTitle[actionType]}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
} 