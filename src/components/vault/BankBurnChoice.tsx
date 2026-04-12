import { Modal } from '../ui/Modal';
import { projectValue } from '../../lib/vault';

interface BankBurnChoiceProps {
  open: boolean;
  amount: number;
  onBank: () => void;
  onBurn: () => void;
}

export function BankBurnChoice({ open, amount, onBank, onBurn }: BankBurnChoiceProps) {
  const in7Days = projectValue(amount, 7);

  return (
    <Modal open={open}>
      <div className="text-center space-y-4">
        <p className="font-mono text-3xl font-bold text-[#f59e0b]">+{amount} XP</p>
        <p className="text-[#8888a0] text-sm">What do you want to do with it?</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Bank */}
          <button
            onClick={onBank}
            className="p-4 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/5
              hover:bg-[#f59e0b]/10 transition-all active:scale-[0.97] text-center"
          >
            <span className="text-3xl">🏦</span>
            <p className="font-semibold text-[#f59e0b] mt-2">Bank It</p>
            <p className="text-[10px] text-[#8888a0] mt-1">
              Worth {in7Days} in 7 days
            </p>
          </button>

          {/* Burn */}
          <button
            onClick={onBurn}
            className="p-4 rounded-xl border border-[#f43f5e]/30 bg-[#f43f5e]/5
              hover:bg-[#f43f5e]/10 transition-all active:scale-[0.97] text-center"
          >
            <span className="text-3xl">🔥</span>
            <p className="font-semibold text-[#f43f5e] mt-2">Burn It</p>
            <p className="text-[10px] text-[#8888a0] mt-1">
              Spend now
            </p>
          </button>
        </div>
      </div>
    </Modal>
  );
}
