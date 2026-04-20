import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  containerClassName?: string
  imageClassName?: string
  width?: number
  height?: number
  padding?: string
}

export function Logo({ 
  containerClassName, 
  imageClassName, 
  width = 36, 
  height = 36, 
  padding = 'p-0.5' 
}: LogoProps) {
  return (
    <div className={cn("flex-shrink-0 flex items-center justify-center overflow-hidden bg-brand-300", containerClassName)}>
      <Image
        src="/logo.webp"
        alt="Bikash Institute Logo"
        width={width}
        height={height}
        className={cn("object-contain", padding, imageClassName)}
        priority
      />
    </div>
  )
}
