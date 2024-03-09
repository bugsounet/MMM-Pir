#!/usr/bin/env python
#-- coding: utf-8 --

# Based From MMM-Pir-Sensor-Lite
# https://github.com/grenagit/MMM-PIR-Sensor-Lite

import RPi.GPIO as GPIO
import time, argparse, sys

pinGpio = None

parser = argparse.ArgumentParser(
  description='Read GPIO state for MMM-Pir',
  epilog="©bugsounet 2024"
)

def gpio_check(x):
  x = int(x)
  if x < 1 or x > 29:
    raise argparse.ArgumentTypeError("GPIO must be between 1 and 29")
  return x

parser.add_argument("-g", "--gpio", help="Define GPIO", type=gpio_check, required=True)

args = parser.parse_args(None if sys.argv[1:] else ['-h'])

pinGpio = args.gpio

try:
  GPIO.setmode(GPIO.BCM)
  GPIO.setwarnings(False)
  GPIO.setup(pinGpio, GPIO.IN)

  while True:
    if GPIO.input(pinGpio):
      print("Detected")
      time.sleep(1)

    time.sleep(1)

except Exception as e:
  print("Error:", e)

finally:
  GPIO.cleanup()
