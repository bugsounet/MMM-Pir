from gpiozero import MotionSensor
from signal import pause
import argparse, sys

parser = argparse.ArgumentParser(
    description='Read MotionSensor state from GPIO for MMM-Pir',
    epilog="©bugsounet 2024"
)

def gpio_check(x):
    x = int(x)
    if x < 1 or x > 29:
        raise argparse.ArgumentTypeError("GPIO must be between 1 and 29")
    return x

parser.add_argument("-g", "--gpio", help="Define GPIO", type=gpio_check, required=True)

args = parser.parse_args(None if sys.argv[1:] else ['-h'])

GPIO = "GPIO" + str(args.gpio)

def motion():
  print('Motion')

def no_motion():
  print("NoMotion")

try:
  pir = MotionSensor(GPIO)
  pir.when_motion = motion
  pir.when_no_motion = no_motion
  pause()
except Exception as e:
  print("Error:", e)
